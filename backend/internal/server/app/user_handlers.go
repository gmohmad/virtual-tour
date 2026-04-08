package app

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/gmohmad/virtual-tour/internal/auth"
	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/models/dto"
	"github.com/gmohmad/virtual-tour/internal/server/common"
)

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password required", http.StatusBadRequest)
		return
	}

	user, err := s.storage.CreateUser(r.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		http.Error(w, "User already exists or other error", http.StatusConflict)
		return
	}

	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		http.Error(w, "Could not generate token", http.StatusInternalServerError)
		return
	}

	resp := dto.AuthResponse{
		Token: token,
		User: &dto.User{
			ID:    user.ID.String(),
			Name:  user.Name,
			Email: user.Email,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
	}
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := s.storage.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "User does not exist", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	if !user.CheckPassword(req.Password) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		http.Error(w, "Could not generate token", http.StatusInternalServerError)
		return
	}

	resp := dto.AuthResponse{
		Token: token,
		User: &dto.User{
			ID:    user.ID.String(),
			Name:  user.Name,
			Email: user.Email,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
	}
}

func (s *Server) handleSearchUsers(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}
	email := string(r.URL.Query().Get(config.EmailKey))
	if email == "" {
		http.Error(w, "Missing email param", http.StatusBadRequest)
		return
	}

	users, err := s.storage.GetUsersByEmailSearch(r.Context(), userID, email)
	if err != nil {
		http.Error(w, "", http.StatusInternalServerError)
		return
	}

	resp := make([]dto.User, 0, len(users))
	for _, user := range users {
		resp = append(resp, dto.User{
			ID:        user.ID.String(),
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.String(),
			UpdatedAt: user.UpdatedAt.String(),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
	}
}

func (s *Server) handleGetUserOfCompany(w http.ResponseWriter, r *http.Request) {
	reqData, err := getRequestData(r, map[string]struct{}{config.UserIDKey: {}, config.CompanyIDKey: {}})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	users, err := s.storage.GetUsersByCompanyID(r.Context(), reqData.userID, reqData.companyID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Company not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	resp := make([]dto.User, 0, len(users))
	for _, user := range users {
		resp = append(resp, dto.User{
			ID:        user.ID.String(),
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt.Format(time.RFC3339),
			UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		})
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleChangeUserRole(w http.ResponseWriter, r *http.Request) {
	reqData, err := getRequestData(r, map[string]struct{}{config.UserIDKey: {}, config.CompanyIDKey: {}})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req dto.UserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := s.storage.ChangeUserRole(r.Context(), reqData.userID, req.TargetUserID, reqData.companyID, req.Role); err != nil {
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

func (s *Server) handleRemoveUserFromCompany(w http.ResponseWriter, r *http.Request) {
	reqData, err := getRequestData(r, map[string]struct{}{config.UserIDKey: {}, config.CompanyIDKey: {}})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req dto.UserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := s.storage.DeleteUserCompanyRole(r.Context(), reqData.userID, req.TargetUserID, reqData.companyID); err != nil {
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
