package storage

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Tour struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Name      string
	Data      json.RawMessage
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (s *Storage) CreateTour(ctx context.Context, userID uuid.UUID, name string, data json.RawMessage) (*Tour, error) {
	var tour Tour
	query := `INSERT INTO tours (name, data, user_id) 
	          VALUES ($1, $2, $3) 
	          RETURNING id, name, data, user_id, created_at, updated_at`

	if err := s.client.QueryRow(ctx, query, name, data, userID).Scan(
		&tour.ID, &tour.Name, &tour.Data, &tour.UserID, &tour.CreatedAt, &tour.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &tour, nil
}

func (s *Storage) UpdateTour(ctx context.Context, id, userID uuid.UUID, name string, data json.RawMessage) (*Tour, error) {
	var tour Tour
	query := `UPDATE tours 
	          SET name = $3, data = $4, updated_at = NOW() 
	          WHERE id = $1 AND user_id = $2
	          RETURNING id, name, data, user_id, created_at, updated_at`
	if err := s.client.QueryRow(ctx, query, id, userID, name, data).Scan(
		&tour.ID, &tour.Name, &tour.Data, &tour.UserID, &tour.CreatedAt, &tour.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &tour, nil
}

func (s *Storage) DeleteTour(ctx context.Context, id, userID uuid.UUID) error {
	query := `DELETE FROM tours WHERE id = $1 AND user_id = $2`
	commandTag, err := s.client.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s *Storage) GetTourByID(ctx context.Context, id uuid.UUID) (*Tour, error) {
	var tour Tour
	query := `SELECT id, name, data, user_id, created_at, updated_at FROM tours WHERE id = $1`
	if err := s.client.QueryRow(ctx, query, id).Scan(
		&tour.ID, &tour.Name, &tour.Data, &tour.UserID, &tour.CreatedAt, &tour.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &tour, nil
}

func (s *Storage) GetToursByUserID(ctx context.Context, userID uuid.UUID) ([]Tour, error) {
	rows, err := s.client.Query(ctx, `SELECT id, name, data, user_id, created_at, updated_at FROM tours WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tours []Tour
	for rows.Next() {
		var t Tour
		if err := rows.Scan(&t.ID, &t.Name, &t.Data, &t.UserID, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tours = append(tours, t)
	}
	return tours, rows.Err()
}
