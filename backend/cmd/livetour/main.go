package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"

	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/livetour"
	livetour_server "github.com/gmohmad/virtual-tour/internal/server/livetour"
	"github.com/gmohmad/virtual-tour/internal/storage"
	"github.com/gmohmad/virtual-tour/internal/storage/postgres"
)

func main() {
	logger, err := config.SetupLogger()
	if err != nil {
		log.Fatalf("failed setting up logger: %v", err)
	}

	cfg, err := config.MustLoad(os.Getenv("CONFIG_PATH"))
	if err != nil {
		logger.Fatal("failed loading config", zap.Error(err))
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	postgresClient, err := postgres.NewClient(ctx, cfg.DB, logger)
	if err != nil {
		logger.Fatal("failed creating postgres client", zap.Error(err))
	}
	defer postgresClient.Close()

	if err := postgres.Migrate(cfg.DB, logger); err != nil {
		logger.Fatal("failed applying migrations", zap.Error(err))
	}

	store := storage.NewStorage(postgresClient, logger)
	hub := livetour.NewHub(cfg, logger, store)
	hub.Run(ctx)

	server := livetour_server.New(cfg, logger, hub)
	go func() {
		if err := server.ListenAndServe(context.Background()); err != nil {
			logger.Fatal("failed starting WS server", zap.Error(err))
		}
	}()
	logger.Info("server started and is listening")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit

	if err := server.Shutdown(context.Background()); err != nil {
		logger.Fatal("failed shutting down server", zap.Error(err))
	}

	logger.Info("server shut down")
}
