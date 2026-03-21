package app

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/gmohmad/diploma/internal/models/dto"
	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Server) handleCreateTour(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}
	req, err := parseTourReqFromMultipart[dto.CreateTourRequest](r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	uploaded, err := s.s3.UploadFilesFromMultipart(r.MultipartForm, s.cfg.S3.Bucket, s.cfg.S3.ImagesPath, req.CompanyID.String())
	if err != nil {
		http.Error(w, "Failed to upload images", http.StatusInternalServerError)
		return
	}
	for i, node := range req.Data.Nodes {
		node.Panorama = uploaded[i]
	}

	tour, err := s.storage.CreateTour(r.Context(), req.CompanyID, userID, req.Name, *req.Data)
	if err != nil {
		http.Error(w, "Failed to create tour", http.StatusInternalServerError)
		return
	}
	updateImagePaths(s.cfg.AppAddress, &tour.Data)

	resp := dto.TourResponse{
		ID:        tour.ID.String(),
		Name:      tour.Name,
		Data:      tour.Data,
		CompanyID: tour.CompanyID.String(),
		CreatedBy: tour.CreatedBy.String(),
		UpdatedBy: tour.UpdatedBy.String(),
		CreatedAt: tour.CreatedAt.Format(time.RFC3339),
		UpdatedAt: tour.UpdatedAt.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleUpdateTour(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := r.ParseMultipartForm(50 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}
	req, err := parseTourReqFromMultipart[dto.UpdateTourRequest](r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	existingTour, err := s.storage.GetTourByID(r.Context(), req.ID)
	if err != nil {
		http.Error(w, "tour with provided not found", http.StatusNotFound)
		return
	}

	uploaded, err := s.s3.UploadFilesFromMultipart(r.MultipartForm, s.cfg.S3.Bucket, s.cfg.S3.ImagesPath, existingTour.CompanyID.String())
	if err != nil {
		http.Error(w, "Failed to upload images", http.StatusInternalServerError)
		return
	}
	for i, node := range req.Data.Nodes {
		node.Panorama = uploaded[i]
	}

	tour, err := s.storage.UpdateTour(r.Context(), req.ID, userID, req.Name, *req.Data)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Tour not found or you don't have permission", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to update tour", http.StatusInternalServerError)
		}
		return
	}
	updateImagePaths(s.cfg.AppAddress, &tour.Data)

	keysToClean := make([]string, 0, len(existingTour.Data.Nodes))
	for _, node := range existingTour.Data.Nodes {
		keysToClean = append(keysToClean, node.Panorama)
	}
	if err := s.s3.DeleteFiles(s.cfg.S3.Bucket, keysToClean); err != nil {
		http.Error(w, "failed clearing old files", http.StatusInternalServerError)
		return
	}

	resp := dto.TourResponse{
		ID:        tour.ID.String(),
		Name:      tour.Name,
		Data:      tour.Data,
		CompanyID: tour.CompanyID.String(),
		CreatedBy: tour.CreatedBy.String(),
		UpdatedBy: tour.UpdatedBy.String(),
		CreatedAt: tour.CreatedAt.Format(time.RFC3339),
		UpdatedAt: tour.UpdatedAt.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleDeleteTour(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid tour ID", http.StatusBadRequest)
		return
	}

	if err := s.storage.DeleteTour(r.Context(), id); err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Tour not found or you don't have permission", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete tour", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleGetTourByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid tour ID", http.StatusBadRequest)
		return
	}

	tour, err := s.storage.GetTourByID(r.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Tour not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	resp := dto.TourResponse{
		ID:        tour.ID.String(),
		Name:      tour.Name,
		Data:      tour.Data,
		CompanyID: tour.CompanyID.String(),
		CreatedBy: tour.CreatedBy.String(),
		UpdatedBy: tour.UpdatedBy.String(),
		CreatedAt: tour.CreatedAt.Format(time.RFC3339),
		UpdatedAt: tour.UpdatedAt.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleGetUserTours(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tours, err := s.storage.GetToursCreatedByUser(r.Context(), userID)
	if err != nil {
		http.Error(w, "Failed to retrieve tours", http.StatusInternalServerError)
		return
	}

	resp := make([]dto.TourResponse, len(tours))
	for i, t := range tours {
		resp[i] = dto.TourResponse{
			ID:        t.ID.String(),
			Name:      t.Name,
			Data:      t.Data,
			CompanyID: t.CompanyID.String(),
			CreatedBy: t.CreatedBy.String(),
			UpdatedBy: t.UpdatedBy.String(),
			CreatedAt: t.CreatedAt.Format(time.RFC3339),
			UpdatedAt: t.UpdatedAt.Format(time.RFC3339),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleGetToursByCompanyID(w http.ResponseWriter, r *http.Request) {
	companyID, err := uuid.Parse(r.PathValue("companyId"))
	if err != nil {
		http.Error(w, "Invalid tour ID", http.StatusBadRequest)
		return
	}

	tours, err := s.storage.GetToursByCompanyID(r.Context(), companyID)
	if err != nil {
		http.Error(w, "Failed to retrieve tours", http.StatusInternalServerError)
		return
	}

	resp := make([]dto.TourResponse, len(tours))
	for i, t := range tours {
		resp[i] = dto.TourResponse{
			ID:        t.ID.String(),
			Name:      t.Name,
			Data:      t.Data,
			CompanyID: t.CompanyID.String(),
			CreatedBy: t.CreatedBy.String(),
			UpdatedBy: t.UpdatedBy.String(),
			CreatedAt: t.CreatedAt.Format(time.RFC3339),
			UpdatedAt: t.UpdatedAt.Format(time.RFC3339),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) serveImage(w http.ResponseWriter, r *http.Request) {
	obj, err := s.s3.Download(r.URL.Path, s.cfg.S3.Bucket)
	if err != nil {
		http.Error(w, "Failed downloading from s3", http.StatusInternalServerError)
		return
	}

	if _, err := io.Copy(w, bytes.NewReader(obj)); err != nil {
		http.Error(w, "Failed writing body", http.StatusInternalServerError)
		return
	}
}
