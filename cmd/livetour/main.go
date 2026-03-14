package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/livetour"
	livetour_server "github.com/gmohmad/diploma/internal/server/livetour"
)

func main() {
	cfg, err := config.MustLoad(os.Getenv("CONFIG_PATH"))
	if err != nil {
		log.Fatalf("failed loading config: %v", err)
	}

	hub := livetour.NewHub()
	server := livetour_server.New(cfg, hub)
	go func() {
		if err := server.ListenAndServe(context.Background()); err != nil {
			log.Fatalf("failed starting WS server: %v", err)
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
