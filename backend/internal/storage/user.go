package storage

import (
	"context"

	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func (s *Storage) CreateUser(ctx context.Context, name, email, password string) (*domain.User, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, name, email, password_hash, created_at, updated_at
	`
	rows, err := s.client.Query(ctx, query, name, email, string(hashed))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.User])
}

func (s *Storage) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, name, email, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	rows, err := s.client.Query(ctx, query, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.User])
}

func (s *Storage) GetUsersByCompanyID(ctx context.Context, companyID uuid.UUID) ([]*domain.UserWithRole, error) {
	query := `
        SELECT u.id, u.name, u.email, u.created_at, u.updated_at, cr.role
        FROM users u
        JOIN company_roles cr ON u.id = cr.user_id
        WHERE cr.company_id = $1
    `
	rows, err := s.client.Query(ctx, query, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, pgx.RowToAddrOfStructByPos[domain.UserWithRole])
}
