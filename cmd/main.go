package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/ws"
)

func main() {
	// cfg, err := config.MustLoad(os.Getenv("CONFIG_PATH"))
	cfg, err := config.MustLoad("config/config.yml")
	if err != nil {
		log.Fatalf("failed loading config: %v", err)
	}

	wsServer := ws.New(cfg)
	go func() {
		if err := wsServer.ListenAndServe(context.Background()); err != nil {
			log.Fatalf("failed starting WS server: %v", err)
		}
	}()
	log.Println("WS server started and is listening")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit

	if err := wsServer.Shutdown(context.Background()); err != nil {
		log.Fatalf("failed shutting down WS server: %v", err)
	}

	log.Println("Server shut down")
}
