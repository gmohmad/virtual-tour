package app

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type createTourRequest struct {
	Name string          `json:"name"`
	Data json.RawMessage `json:"data"`
}

type updateTourRequest struct {
	Name string          `json:"name"`
	Data json.RawMessage `json:"data"`
}

type tourResponse struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Data      json.RawMessage `json:"data"`
	UserID    string          `json:"user_id"`
	CreatedAt string          `json:"created_at"`
	UpdatedAt string          `json:"updated_at"`
}

func (s *Server) handleCreateTour(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req createTourRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Tour name is required", http.StatusBadRequest)
		return
	}

	tour, err := s.storage.CreateTour(r.Context(), userID, req.Name, req.Data)
	if err != nil {
		http.Error(w, "Failed to create tour", http.StatusInternalServerError)
		return
	}

	resp := tourResponse{
		ID:        tour.ID.String(),
		Name:      tour.Name,
		Data:      tour.Data,
		UserID:    tour.UserID.String(),
		CreatedAt: tour.CreatedAt.Format(time.RFC3339),
		UpdatedAt: tour.UpdatedAt.Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleUpdateTour(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid tour ID", http.StatusBadRequest)
		return
	}

	var req updateTourRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "Tour name cannot be empty", http.StatusBadRequest)
		return
	}

	tour, err := s.storage.UpdateTour(r.Context(), id, userID, req.Name, req.Data)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Tour not found or you don't have permission", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to update tour", http.StatusInternalServerError)
		}
		return
	}

	resp := tourResponse{
		ID:        tour.ID.String(),
		Name:      tour.Name,
		Data:      tour.Data,
		UserID:    tour.UserID.String(),
		CreatedAt: tour.CreatedAt.Format(time.RFC3339),
		UpdatedAt: tour.UpdatedAt.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleDeleteTour(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid tour ID", http.StatusBadRequest)
		return
	}

	err = s.storage.DeleteTour(r.Context(), id, userID)
	if err != nil {
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

	resp := tourResponse{
		ID:        tour.ID.String(),
		Name:      tour.Name,
		Data:      tour.Data,
		UserID:    tour.UserID.String(),
		CreatedAt: tour.CreatedAt.Format(time.RFC3339),
		UpdatedAt: tour.UpdatedAt.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleGetUserTours(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tours, err := s.storage.GetToursByUserID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Failed to retrieve tours", http.StatusInternalServerError)
		return
	}

	resp := make([]tourResponse, len(tours))
	for i, t := range tours {
		resp[i] = tourResponse{
			ID:        t.ID.String(),
			Name:      t.Name,
			Data:      t.Data,
			UserID:    t.UserID.String(),
			CreatedAt: t.CreatedAt.Format(time.RFC3339),
			UpdatedAt: t.UpdatedAt.Format(time.RFC3339),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
