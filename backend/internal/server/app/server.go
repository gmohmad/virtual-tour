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

	r.HandleFunc("GET /get-tour-by-id/{id}", common.AuthMiddleware(s.handleGetTourByID))
	r.HandleFunc("GET /get-tours-by-user-id", common.AuthMiddleware(s.handleGetUserTours))
	r.HandleFunc("POST /create-tour", common.AuthMiddleware(s.handleCreateTour))
	r.HandleFunc("PUT /update-tour/{id}", common.AuthMiddleware(s.handleUpdateTour))
	r.HandleFunc("DELETE /delete-tour/{id}", common.AuthMiddleware(s.handleDeleteTour))

	s.server.Handler = r
}
