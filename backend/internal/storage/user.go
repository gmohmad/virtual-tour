package storage

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           uuid.UUID
	Name         string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type UserWithRole struct {
	User
	Role string
}

func (s *Storage) CreateUser(ctx context.Context, name, email, password string) (*User, error) {
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
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[User])
}

func (s *Storage) GetUserByEmail(ctx context.Context, email string) (*User, error) {
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
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[User])
}

func (s *Storage) GetUsersByCompanyID(ctx context.Context, companyID uuid.UUID) ([]*UserWithRole, error) {
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

	return pgx.CollectRows(rows, pgx.RowToAddrOfStructByPos[UserWithRole])
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
