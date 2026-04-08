package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/models/domain"
	"github.com/gmohmad/virtual-tour/internal/models/dto"
	"github.com/gmohmad/virtual-tour/internal/server/common"
)

func (s *Server) handleCreateCompany(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	companyReq, err := parseCompanyReq(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	company, err := s.storage.CreateCompany(r.Context(), userID, companyReq.Name)
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
	reqData, err := getRequestData(r, map[string]struct{}{config.UserIDKey: {}, config.CompanyIDKey: {}})
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	companyReq, err := parseCompanyReq(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	company, err := s.storage.UpdateCompany(r.Context(), reqData.userID, reqData.companyID, companyReq.Name)
	if err != nil {
		if errors.Is(err, domain.ErrInsufficientPermissions) {
			http.Error(w, err.Error(), http.StatusForbidden)
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
	reqData, err := getRequestData(r, map[string]struct{}{config.UserIDKey: {}, config.CompanyIDKey: {}})
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := s.storage.DeleteCompany(r.Context(), reqData.userID, reqData.companyID); err != nil {
		if errors.Is(err, domain.ErrInsufficientPermissions) {
			http.Error(w, err.Error(), http.StatusForbidden)
		} else {
			http.Error(w, "Failed to update company", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleGetCompanyByID(w http.ResponseWriter, r *http.Request) {
	reqData, err := getRequestData(r, map[string]struct{}{config.UserIDKey: {}, config.CompanyIDKey: {}})
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	company, err := s.storage.GetCompanyByID(r.Context(), reqData.userID, reqData.companyID)
	if err != nil {
		if errors.Is(err, domain.ErrInsufficientPermissions) {
			http.Error(w, err.Error(), http.StatusForbidden)
		} else {
			http.Error(w, "Failed to update company", http.StatusInternalServerError)
		}
		return
	}

	resp := dto.CompanyWithUserRoleResponse{
		CompanyResponse: dto.CompanyResponse{
			ID:        company.ID.String(),
			Name:      company.Name,
			CreatedAt: company.CreatedAt.Format(time.RFC3339),
			UpdatedAt: company.UpdatedAt.Format(time.RFC3339),
		},
		UserRole: company.UserRole,
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
			CompanyResponse: dto.CompanyResponse{
				ID:        company.ID.String(),
				Name:      company.Name,
				CreatedAt: company.CreatedAt.Format(time.RFC3339),
				UpdatedAt: company.UpdatedAt.Format(time.RFC3339),
			},
			UserRole: company.UserRole,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleAddMemberToCompany(w http.ResponseWriter, r *http.Request) {
	reqData, err := getRequestData(r, map[string]struct{}{config.UserIDKey: {}, config.CompanyIDKey: {}})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req dto.UserIDsBatch
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Failed unmarshalling body", http.StatusBadRequest)
		return
	}
	if len(req.UserIDs) == 0 {
		http.Error(w, "Empty user ids list", http.StatusBadRequest)
		return
	}

	if err := s.storage.AddUsersToCompany(r.Context(), reqData.userID, reqData.companyID, req.UserIDs); err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Company not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	common.WriteResponse(w, "success", http.StatusOK)
}
