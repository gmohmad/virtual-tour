package app

import (
	"encoding/json"
	"net/http"

	"github.com/gmohmad/diploma/internal/auth"
	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/models/dto"
	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/jackc/pgx/v5"
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
