package storage

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/models/domain"
)

func (s *Storage) GetUserRole(ctx context.Context, userID, companyID uuid.UUID) (string, error) {
	query := `SELECT role FROM company_roles WHERE user_id = $1 AND company_id = $2`
	rows, err := s.client.Query(ctx, query, userID, companyID)
	if err != nil {
		return "", err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowTo[string])
}

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

func (s *Storage) GetUsersByEmailSearch(ctx context.Context, userID uuid.UUID, email string) ([]*domain.User, error) {
	query := `
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users
        WHERE id != $1 AND email LIKE '%' || $2 || '%'
    `
	rows, err := s.client.Query(ctx, query, userID, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToAddrOfStructByPos[domain.User])
}

func (s *Storage) GetUsersByCompanyID(ctx context.Context, userID, companyID uuid.UUID) ([]*domain.UserWithRole, error) {
	if !s.CheckPermission(ctx, userID, companyID, config.MemberRole) {
		return nil, domain.ErrInsufficientPermissions
	}
	query := `
        SELECT u.id, u.name, u.email, u.password_hash, u.created_at, u.updated_at, cr.role
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

func (s *Storage) ChangeUserRole(ctx context.Context, userID, targetUserID, companyID uuid.UUID, newRole string) error {
	if !s.CheckPermission(ctx, userID, companyID, config.OwnerRole) {
		return domain.ErrInsufficientPermissions
	}
	query := `UPDATE company_roles
	          SET role = $3
	          WHERE user_id = $1 AND company_id = $2`
	commandTag, err := s.client.Exec(ctx, query, targetUserID, companyID, newRole)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s *Storage) DeleteUserCompanyRole(ctx context.Context, userID, targetUserID, companyID uuid.UUID) error {
	if userID != targetUserID && !s.CheckPermission(ctx, userID, companyID, config.OwnerRole) {
		return domain.ErrInsufficientPermissions
	}
	query := `DELETE FROM company_roles WHERE user_id = $1 AND company_id = $2`
	commandTag, err := s.client.Exec(ctx, query, targetUserID, companyID)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
