package storage

import (
	"context"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/google/uuid"
)

func (s *Storage) CheckPermission(ctx context.Context, userID, companyID uuid.UUID, expected string) bool {
	actual, err := s.GetUserRole(ctx, userID, companyID)
	if err != nil {
		return false
	}
	return config.RolePriority[expected] <= config.RolePriority[actual]
}
