package app

import (
	"context"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	fm "github.com/gmohmad/diploma/internal/filemanager"
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
	s3      *fm.S3Provider
}

func New(cfg *config.Config, logger *zap.Logger, storage *storage.Storage, s3 *fm.S3Provider) *Server {
	ws := &Server{
		cfg:    cfg,
		logger: logger,
		server: &http.Server{
			Addr: cfg.HTTPServer.AppAddress,
		},
		storage: storage,
		s3:      s3,
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

	r.HandleFunc("GET /images/{path...}", s.serveImage)
	r.HandleFunc("GET /get-tour-by-id/{id}", s.handleGetTourByID)
	r.HandleFunc("GET /get-tours-by-user-id", common.AuthMiddleware(s.handleGetUserTours))
	r.HandleFunc("POST /create-tour", common.AuthMiddleware(s.handleCreateTour))
	r.HandleFunc("PUT /update-tour", common.AuthMiddleware(s.handleUpdateTour))
	r.HandleFunc("DELETE /delete-tour/{id}", common.AuthMiddleware(s.handleDeleteTour))

	r.HandleFunc("GET /get-company/{id}", common.AuthMiddleware(s.handleGetCompanyByID))
	r.HandleFunc("POST /create-company", common.AuthMiddleware(s.handleCreateCompany))
	r.HandleFunc("PUT /update-company", common.AuthMiddleware(s.handleUpdateCompany))
	r.HandleFunc("DELETE /delete-company/{id}", common.AuthMiddleware(s.handleDeleteCompany))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://192.168.66.102:3000"},
		AllowedMethods:   []string{"GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Origin"},
		AllowCredentials: true,
		Debug:            false,
	})
	s.server.Handler = c.Handler(r)
}
