package domain

import (
	"time"

	"github.com/google/uuid"
)

type Company struct {
	ID        uuid.UUID
	Name      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type CompanyWithUserRole struct {
	Company
	UserRole string
}
