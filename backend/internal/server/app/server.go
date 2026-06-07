package app

import (
	"context"
	"net/http"

	"github.com/rs/cors"
	"go.uber.org/zap"

	"github.com/gmohmad/virtual-tour/internal/config"
	fm "github.com/gmohmad/virtual-tour/internal/filemanager"
	"github.com/gmohmad/virtual-tour/internal/server/common"
	"github.com/gmohmad/virtual-tour/internal/storage"
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
	r.HandleFunc("GET /search-users", common.AuthMiddleware(s.handleSearchUsers))

	r.HandleFunc("GET /images/{path...}", s.serveImage)

	r.HandleFunc("POST /create-company", common.AuthMiddleware(s.handleCreateCompany))
	r.HandleFunc("PUT /update-company/{companyId}", common.AuthMiddleware(s.handleUpdateCompany))
	r.HandleFunc("DELETE /delete-company/{companyId}", common.AuthMiddleware(s.handleDeleteCompany))
	r.HandleFunc("GET /get-company/{companyId}", common.AuthMiddleware(s.handleGetCompanyByID))
	r.HandleFunc("GET /get-user-companies", common.AuthMiddleware(s.handleGetCompaniesOfUser))
	r.HandleFunc("POST /add-members-to-company/{companyId}", common.AuthMiddleware(s.handleAddMemberToCompany))

	r.HandleFunc("POST /company/{companyId}/delete-user", common.AuthMiddleware(s.handleRemoveUserFromCompany))
	r.HandleFunc("POST /company/{companyId}/change-user-role", common.AuthMiddleware(s.handleChangeUserRole))
	r.HandleFunc("GET /company/{companyId}/get-users", common.AuthMiddleware(s.handleGetUserOfCompany))
	r.HandleFunc("POST /company/{companyId}/create-tour", common.AuthMiddleware(s.handleCreateTour))
	r.HandleFunc("PUT /company/{companyId}/update-tour/{tourId}", common.AuthMiddleware(s.handleUpdateTour))
	r.HandleFunc("DELETE /company/{companyId}/delete-tour/{tourId}", common.AuthMiddleware(s.handleDeleteTour))
	r.HandleFunc("GET /company/{companyId}/get-tours", common.AuthMiddleware(s.handleGetToursByCompanyID))
	r.HandleFunc("GET /get-tour-by-id/{tourId}", s.handleGetTourByID)
	r.HandleFunc("GET /get-user-tours", common.AuthMiddleware(s.handleGetUserTours))
	r.HandleFunc("GET /company/{companyId}/session-history", common.AuthMiddleware(s.handleGetSessionHistory))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "http://192.168.137.102:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Origin"},
		AllowCredentials: true,
		Debug:            false,
	})
	s.server.Handler = c.Handler(r)
}
