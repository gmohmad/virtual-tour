package livetour

import (
	"context"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	livetour "github.com/gmohmad/diploma/internal/livetour"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(*http.Request) bool { return true },
}

type Server struct {
	server *http.Server
	hub    *livetour.Hub
}

func New(cfg *config.Config, hub *livetour.Hub) *Server {
	ws := &Server{
		server: &http.Server{
			Addr: cfg.HTTPServer.Address,
		},
		hub: hub,
	}
	return ws
}

func (s *Server) ListenAndServe(ctx context.Context) error {
	s.setupHandler()
	return s.server.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}

func (s *Server) setupHandler() {
	r := http.NewServeMux()

	r.HandleFunc("GET /connect", s.handleConnectToSession)
	r.HandleFunc("GET /end-session", s.handleEndSession)
	r.HandleFunc("POST /create-session", s.handleCreateSession)

	s.server.Handler = r
}
