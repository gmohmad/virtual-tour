package app

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gmohmad/diploma/internal/models/dto"
	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Server) handleCreateCompany(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req dto.CreateCompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Company name is required", http.StatusBadRequest)
		return
	}

	company, err := s.storage.CreateCompany(r.Context(), userID, req.Name)
	if err != nil {
		http.Error(w, "Failed to create company", http.StatusInternalServerError)
		return
	}

	resp := dto.CompanyResponse{
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
	var req dto.UpdateCompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "Company name cannot be empty", http.StatusBadRequest)
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

	resp := dto.CompanyResponse{
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
		http.Error(w, "Invalid company ID", http.StatusBadRequest)
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

func (s *Server) handleGetCompanyByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Company ID", http.StatusBadRequest)
		return
	}

	company, err := s.storage.GetCompanyByID(r.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Company not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	resp := dto.CompanyResponse{
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

func (s *Server) handleGetCompaniesOfUser(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	companies, err := s.storage.GetCompaniesOfUser(r.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Company not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	resp := make([]dto.CompanyWithUserRoleResponse, 0, len(companies))
	for _, company := range companies {
		resp = append(resp, dto.CompanyWithUserRoleResponse{
			ID:        company.ID.String(),
			Name:      company.Name,
			CreatedAt: company.CreatedAt.Format(time.RFC3339),
			UpdatedAt: company.UpdatedAt.Format(time.RFC3339),
			UserRole:  company.UserRole,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}
