package ws

import (
	"context"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	livetour "github.com/gmohmad/diploma/internal/live_tour"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(*http.Request) bool { return true },
}

type WSServer struct {
	server *http.Server
	hub    *livetour.Hub
}

func New(cfg *config.Config) *WSServer {
	ws := &WSServer{
		server: &http.Server{
			Addr: cfg.HTTPServer.Port,
		},
		hub: livetour.NewHub(),
	}
	return ws
}

func (s *WSServer) ListenAndServe(ctx context.Context) error {
	s.setupHandler()
	return s.server.ListenAndServe()
}

func (s *WSServer) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}

func (s *WSServer) setupHandler() {
	r := http.NewServeMux()

	r.HandleFunc("/connect", s.handleConnectToSession)

	r.HandleFunc("/create-session", s.handleCreateSession)

	r.HandleFunc("/end-session", s.handleEndSession)

	s.server.Handler = r
}
