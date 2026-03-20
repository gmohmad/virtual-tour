package storage

import (
	"context"

	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Storage) CreateTour(
	ctx context.Context, companyID uuid.UUID, userID uuid.UUID, name string, data domain.TourData,
) (*domain.Tour, error) {
	query := `INSERT INTO tours (name, data, created_by, updated_by, company_id)
	          VALUES ($1, $2, $3, $3, $4)
	          RETURNING id, name, data, company_id, created_by, updated_by, created_at, updated_at`
	rows, err := s.client.Query(ctx, query, name, data, userID, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Tour])
}

func (s *Storage) UpdateTour(ctx context.Context, id, userID uuid.UUID, name string, data domain.TourData) (*domain.Tour, error) {
	query := `UPDATE tours 
	          SET name = $3, data = $4, updated_by = $2, updated_at = NOW()
	          WHERE id = $1
	          RETURNING id, name, data, company_id, created_by, updated_by, created_at, updated_at`
	rows, err := s.client.Query(ctx, query, id, userID, name, data)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Tour])
}

func (s *Storage) DeleteTour(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tours WHERE id = $1`
	commandTag, err := s.client.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s *Storage) GetTourByID(ctx context.Context, id uuid.UUID) (*domain.Tour, error) {
	query := `SELECT id, name, data, company_id, created_by, updated_by, created_at, updated_at FROM tours WHERE id = $1`
	rows, err := s.client.Query(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Tour])
}

func (s *Storage) GetToursCreatedByUser(ctx context.Context, userID uuid.UUID) ([]*domain.Tour, error) {
	query := `SELECT id, name, data, company_id, created_by, updated_by, created_at, updated_at FROM tours WHERE created_by = $1`
	rows, err := s.client.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToAddrOfStructByPos[domain.Tour])
}

func (s *Storage) GetToursByCompanyID(ctx context.Context, companyID uuid.UUID) ([]*domain.Tour, error) {
	query := `SELECT id, name, data, company_id, created_by, updated_by, created_at, updated_at FROM tours WHERE company_id = $1`
	rows, err := s.client.Query(ctx, query, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToAddrOfStructByPos[domain.Tour])
}
