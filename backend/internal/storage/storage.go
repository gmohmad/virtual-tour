package storage

import (
	"github.com/gmohmad/diploma/internal/storage/postgres"
)

type Storage struct {
	client postgres.Client
}

func NewStorage(client postgres.Client) *Storage {
	return &Storage{
		client: client,
	}
}
