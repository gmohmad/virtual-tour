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
)

func main() {
	cfg, err := config.MustLoad(os.Getenv("CONFIG_PATH"))
	if err != nil {
		log.Fatalf("failed loading config: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	postgresClient, err := postgres.NewClient(ctx, cfg.DB)
	if err != nil {
		log.Fatal(err)
	}
	defer postgresClient.Close()

	if err := postgres.Migrate(cfg.DB); err != nil {
		log.Fatal(err)
	}

	storage := storage.NewStorage(postgresClient)
	server := app_server.New(cfg, storage)
	go func() {
		if err := server.ListenAndServe(context.Background()); err != nil {
			log.Fatalf("failed starting server: %v", err)
		}
	}()
	log.Println("server started and is listening")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit

	if err := server.Shutdown(context.Background()); err != nil {
		log.Fatalf("failed shutting down server: %v", err)
	}

	log.Println("server shut down")
}
