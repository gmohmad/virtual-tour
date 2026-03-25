package dto

import "github.com/google/uuid"

type User struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Role         string `json:"role,omitempty"`
	PasswordHash string `json:"password,omitempty"`
	CreatedAt    string `json:"created_at,omitempty"`
	UpdatedAt    string `json:"updated_at,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type UserIDsBatch struct {
	UserIDs []uuid.UUID `json:"user_ids"`
}
