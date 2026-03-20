package app

import (
	"encoding/json"
	"net/http"

	"github.com/gmohmad/diploma/internal/auth"
	"github.com/gmohmad/diploma/internal/models/dto"
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
		User: &dto.UserJSON{
			ID:    user.ID.String(),
			Name:  user.Name,
			Email: user.Email,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
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
		User: &dto.UserJSON{
			ID:    user.ID.String(),
			Name:  user.Name,
			Email: user.Email,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
