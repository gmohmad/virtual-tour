package livetour

import (
	"context"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"go.uber.org/zap"

	"github.com/gmohmad/virtual-tour/internal/config"
	livetour "github.com/gmohmad/virtual-tour/internal/livetour"
	"github.com/gmohmad/virtual-tour/internal/server/common"
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

	r.HandleFunc("GET /connect/{sessionId}", s.handleConnectToSession)
	r.HandleFunc("GET /get-session/{sessionId}", s.handleGetSession)
	r.HandleFunc("DELETE /end-session/{sessionId}", common.AuthMiddleware(s.handleEndSession))
	r.HandleFunc("POST /create-session", common.AuthMiddleware(s.handleCreateSession))
	r.HandleFunc("GET /session/{sessionId}/blacklist", common.AuthMiddleware(s.handleGetBlacklist))
	r.HandleFunc("DELETE /session/{sessionId}/blacklist/{clientId}", common.AuthMiddleware(s.handleRemoveFromBlacklist))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://192.168.137.102:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	s.server.Handler = c.Handler(r)
}
