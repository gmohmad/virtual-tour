package livetour

import (
	"context"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	livetour "github.com/gmohmad/diploma/internal/livetour"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
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
	r.HandleFunc("GET /create-session", s.handleCreateSession)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	s.server.Handler = c.Handler(r)
}
