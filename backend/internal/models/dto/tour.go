package dto

import (
	"github.com/gmohmad/diploma/internal/models/domain"
)

type TourRequest struct {
	Name string           `json:"name"`
	Data *domain.TourData `json:"data"`
}

type TourResponse struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Data      domain.TourData `json:"data"`
	CompanyID string          `json:"company_id"`
	CreatedBy string          `json:"created_by"`
	UpdatedBy string          `json:"updated_by"`
	CreatedAt string          `json:"created_at"`
	UpdatedAt string          `json:"updated_at"`
}
