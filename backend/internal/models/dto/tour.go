package dto

import (
	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/google/uuid"
)

type CreateTourRequest struct {
	Name      string           `json:"name"`
	Data      *domain.TourData `json:"data"`
	CompanyID uuid.UUID        `json:"company_id"`
}

func (c CreateTourRequest) GetName() string           { return c.Name }
func (c CreateTourRequest) GetData() *domain.TourData { return c.Data }

type UpdateTourRequest struct {
	Name string           `json:"name"`
	ID   uuid.UUID        `json:"id"`
	Data *domain.TourData `json:"data"`
}

func (u UpdateTourRequest) GetName() string           { return u.Name }
func (u UpdateTourRequest) GetData() *domain.TourData { return u.Data }

type TourRequest interface {
	GetName() string
	GetData() *domain.TourData
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
