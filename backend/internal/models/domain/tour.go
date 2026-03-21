package domain

import (
	"time"

	"github.com/google/uuid"
)

type Tour struct {
	ID        uuid.UUID  `json:"id"`
	CompanyID uuid.UUID  `json:"company_id"`
	Name      string     `json:"name"`
	Data      TourData   `json:"data"`
	CreatedBy *uuid.UUID `json:"created_by"`
	UpdatedBy *uuid.UUID `json:"updated_by"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type TourData struct {
	Nodes []*TourNode `json:"nodes"`
}

type TourNode struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Panorama string      `json:"panorama"`
	Links    []*TourLink `json:"links,omitempty"`
}

type TourLink struct {
	Position LinkPosition `json:"position"`
}

type LinkPosition struct {
	Yaw   int `json:"yaw"`
	Pitch int `json:"pitch"`
}
