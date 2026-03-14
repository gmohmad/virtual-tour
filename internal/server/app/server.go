package app

import (
	"context"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/gmohmad/diploma/internal/storage"
)

type Server struct {
	server  *http.Server
	storage *storage.Storage
}

func New(cfg *config.Config, storage *storage.Storage) *Server {
	ws := &Server{
		server: &http.Server{
			Addr: cfg.HTTPServer.Address,
		},
		storage: storage,
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

	r.HandleFunc("POST /login", s.handleLogin)
	r.HandleFunc("POST /register", s.handleRegister)
	r.HandleFunc("GET /test", common.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte("SUCCESS"))
	}))

	s.server.Handler = r
}
