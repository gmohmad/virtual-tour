package dto

import "github.com/google/uuid"

type CreateCompanyRequest struct {
	Name string `json:"name"`
}

type UpdateCompanyRequest struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type CompanyResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CompanyWithUserRoleResponse struct {
	CompanyResponse
	UserRole string `json:"user_role"`
}
