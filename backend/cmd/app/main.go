package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gmohmad/diploma/internal/config"
	app_server "github.com/gmohmad/diploma/internal/server/app"
	"github.com/gmohmad/diploma/internal/storage"
	"github.com/gmohmad/diploma/internal/storage/postgres"
	"go.uber.org/zap"
)

func main() {
	logger, err := config.SetupLogger()
	if err != nil {
		log.Fatalf("failed setting up logger: %v", err)
	}

	cfg, err := config.MustLoad(os.Getenv("APP_CONFIG_PATH"))
	if err != nil {
		logger.Fatal("failed loading config", zap.Error(err))
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	postgresClient, err := postgres.NewClient(ctx, cfg.DB, logger)
	if err != nil {
		log.Fatal(err)
	}
	defer postgresClient.Close()

	if err := postgres.Migrate(cfg.DB, logger); err != nil {
		log.Fatal(err)
	}

	storage := storage.NewStorage(postgresClient, logger)
	server := app_server.New(cfg, logger, storage)
	go func() {
		if err := server.ListenAndServe(context.Background()); err != nil {
			logger.Fatal("failed starting server", zap.Error(err))
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
