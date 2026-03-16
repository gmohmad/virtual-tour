package app

import (
	"context"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/gmohmad/diploma/internal/storage"
	"github.com/rs/cors"
	"go.uber.org/zap"
)

type Server struct {
	cfg     *config.Config
	logger  *zap.Logger
	server  *http.Server
	storage *storage.Storage
}

func New(cfg *config.Config, logger *zap.Logger, storage *storage.Storage) *Server {
	ws := &Server{
		cfg:     cfg,
		logger:  logger,
		storage: storage,
		server: &http.Server{
			Addr: cfg.HTTPServer.Address,
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

	r.HandleFunc("POST /login", s.handleLogin)
	r.HandleFunc("POST /register", s.handleRegister)

	r.HandleFunc("GET /public/tour/{id}", s.handleGetTourByID)
	r.HandleFunc("GET /get-tour-by-id/{id}", common.AuthMiddleware(s.handleGetTourByID))
	r.HandleFunc("GET /get-tours-by-user-id", common.AuthMiddleware(s.handleGetUserTours))
	r.HandleFunc("POST /create-tour", common.AuthMiddleware(s.handleCreateTour))
	r.HandleFunc("PUT /update-tour/{id}", common.AuthMiddleware(s.handleUpdateTour))
	r.HandleFunc("DELETE /delete-tour/{id}", common.AuthMiddleware(s.handleDeleteTour))
	r.HandleFunc("POST /upload", common.AuthMiddleware(s.handleUpload))
	r.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Origin"},
		AllowCredentials: true,
		Debug:            false,
	})
	s.server.Handler = c.Handler(r)
}
