package storage

import (
	"context"

	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Storage) CreateCompany(ctx context.Context, name string) (*domain.Company, error) {
	query := `INSERT INTO companies (name)
	          VALUES ($1)
	          RETURNING id, name, created_at, updated_at`
	rows, err := s.client.Query(ctx, query, name)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Company])
}

func (s *Storage) UpdateCompany(ctx context.Context, id uuid.UUID, name string) (*domain.Company, error) {
	query := `UPDATE companies
	          SET name = $2, updated_at = NOW()
	          WHERE id = $1
	          RETURNING id, name, created_at, updated_at`
	rows, err := s.client.Query(ctx, query, name)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Company])
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

func (s *Storage) GetCompanyByID(ctx context.Context, id uuid.UUID) (*domain.Company, error) {
	query := `SELECT id, name, created_at, updated_at FROM companies WHERE id = $1`
	rows, err := s.client.Query(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Company])
}
