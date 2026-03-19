package app

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type createCompanyRequest struct {
	Name string `json:"name"`
}

type updateCompanyRequest struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type companyResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func (s *Server) handleCreateCompany(w http.ResponseWriter, r *http.Request) {
	var req createCompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Company name is required", http.StatusBadRequest)
		return
	}

	company, err := s.storage.CreateCompany(r.Context(), req.Name)
	if err != nil {
		http.Error(w, "Failed to create tour", http.StatusInternalServerError)
		return
	}

	resp := companyResponse{
		ID:        company.ID.String(),
		Name:      company.Name,
		CreatedAt: company.CreatedAt.Format(time.RFC3339),
		UpdatedAt: company.UpdatedAt.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleUpdateCompany(w http.ResponseWriter, r *http.Request) {
	var req updateCompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "Tour name cannot be empty", http.StatusBadRequest)
		return
	}

	company, err := s.storage.UpdateCompany(r.Context(), req.ID, req.Name)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Company not found or you don't have permission", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to update company", http.StatusInternalServerError)
		}
		return
	}

	resp := tourResponse{
		ID:        company.ID.String(),
		Name:      company.Name,
		CreatedAt: company.CreatedAt.Format(time.RFC3339),
		UpdatedAt: company.UpdatedAt.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleDeleteCompany(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid tour ID", http.StatusBadRequest)
		return
	}

	if err := s.storage.DeleteCompany(r.Context(), id); err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Company not found or you don't have permission", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete company", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
