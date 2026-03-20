package livetour

import (
	"context"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	livetour "github.com/gmohmad/diploma/internal/livetour"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"go.uber.org/zap"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(*http.Request) bool { return true },
}

type Server struct {
	cfg    *config.Config
	logger *zap.Logger
	server *http.Server
	hub    *livetour.Hub
}

func New(cfg *config.Config, logger *zap.Logger, hub *livetour.Hub) *Server {
	ws := &Server{
		cfg:    cfg,
		logger: logger,
		hub:    hub,
		server: &http.Server{
			Addr: cfg.HTTPServer.LiveTourAddress,
		},
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
		AllowedOrigins:   []string{"http://localhost:3000", "http://192.168.66.102:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	s.server.Handler = c.Handler(r)
}
