package livetour

import (
	"context"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"go.uber.org/zap"
	"golang.org/x/time/rate"

	"github.com/gmohmad/virtual-tour/internal/config"
	livetour "github.com/gmohmad/virtual-tour/internal/livetour"
	"github.com/gmohmad/virtual-tour/internal/server/common"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(*http.Request) bool { return true },
}

type Server struct {
	cfg           *config.Config
	logger        *zap.Logger
	server        *http.Server
	hub           *livetour.Hub
	createLimiter *rate.Limiter
}

func New(cfg *config.Config, logger *zap.Logger, hub *livetour.Hub) *Server {
	return &Server{
		cfg:    cfg,
		logger: logger,
		hub:    hub,
		server: &http.Server{
			Addr: cfg.HTTPServer.LiveTourAddress,
		},
		createLimiter: rate.NewLimiter(5.0/60.0, 5),
	}
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

	r.HandleFunc("POST /create-session",
		s.rateLimitCreate(common.AuthMiddleware(s.handleCreateSession)),
	)

	r.HandleFunc("GET /connect/{sessionId}", s.handleConnectToSession)
	r.HandleFunc("GET /get-session/{sessionId}", s.handleGetSession)
	r.HandleFunc("DELETE /end-session/{sessionId}", common.AuthMiddleware(s.handleEndSession))
	r.HandleFunc("GET /session/{sessionId}/blacklist", common.AuthMiddleware(s.handleGetBlacklist))
	r.HandleFunc("DELETE /session/{sessionId}/blacklist/{clientId}", common.AuthMiddleware(s.handleRemoveFromBlacklist))

	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://localhost:3000",
			"http://192.168.115.100:3000",
			"http://localhost",
			"https://localhost",
			"capacitor://localhost",
			"http://capacitor.localhost",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	s.server.Handler = c.Handler(r)
}

func (s *Server) rateLimitCreate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.createLimiter.Allow() {
			http.Error(w, "Too many session creation requests (max 5 per minute)", http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}
