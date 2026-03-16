package storage

import (
	"github.com/gmohmad/diploma/internal/storage/postgres"
	"go.uber.org/zap"
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
