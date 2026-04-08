package storage

import (
	"go.uber.org/zap"

	"github.com/gmohmad/virtual-tour/internal/storage/postgres"
)

type Storage struct {
	client postgres.Client
	logger *zap.Logger
}

func NewStorage(client postgres.Client, logger *zap.Logger) *Storage {
	return &Storage{
		client: client,
		logger: logger,
	}
}
