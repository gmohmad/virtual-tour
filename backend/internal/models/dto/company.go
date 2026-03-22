package dto

type CompanyRequest struct {
	Name string `json:"name"`
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
