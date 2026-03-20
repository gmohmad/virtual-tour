package dto

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
	Token string    `json:"token"`
	User  *UserJSON `json:"user"`
}

type UserJSON struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}
