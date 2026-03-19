package storage

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Company struct {
	ID        uuid.UUID
	Name      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (s *Storage) CreateCompany(ctx context.Context, name string) (*Company, error) {
	query := `INSERT INTO companies (name)
	          VALUES ($1)
	          RETURNING id, name, created_at, updated_at`
	rows, err := s.client.Query(ctx, query, name)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[Company])
}

func (s *Storage) UpdateCompany(ctx context.Context, id uuid.UUID, name string) (*Company, error) {
	query := `UPDATE companies
	          SET name = $2, updated_at = NOW()
	          WHERE id = $1
	          RETURNING id, name, created_at, updated_at`
	rows, err := s.client.Query(ctx, query, name)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[Company])
}

func (s *Storage) DeleteCompany(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM companies WHERE id = $1`
	commandTag, err := s.client.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
