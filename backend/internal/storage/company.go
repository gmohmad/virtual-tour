package storage

import (
	"context"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Storage) CreateCompany(ctx context.Context, userID uuid.UUID, name string) (*domain.Company, error) {
	tx, err := s.client.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	query := `INSERT INTO companies (name) VALUES ($1) RETURNING id, name, created_at, updated_at`
	rows, err := tx.Query(ctx, query, name)
	if err != nil {
		return nil, err
	}
	company, err := pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Company])
	if err != nil {
		return nil, err
	}

	roleQuery := `INSERT INTO company_roles (user_id, company_id, role) VALUES ($1, $2, 'owner')`
	if _, err = tx.Exec(ctx, roleQuery, userID, company.ID); err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}
	return company, nil
}

func (s *Storage) UpdateCompany(ctx context.Context, userID, companyID uuid.UUID, name string) (*domain.Company, error) {
	if !s.CheckPermission(ctx, userID, companyID, config.OwnerRole) {
		return nil, domain.ErrInsufficientPermissions
	}
	query := `UPDATE companies
	          SET name = $2, updated_at = NOW()
	          WHERE id = $1
	          RETURNING id, name, created_at, updated_at`
	rows, err := s.client.Query(ctx, query, companyID, name)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Company])
}

func (s *Storage) DeleteCompany(ctx context.Context, userID, companyID uuid.UUID) error {
	if !s.CheckPermission(ctx, userID, companyID, config.OwnerRole) {
		return domain.ErrInsufficientPermissions
	}
	query := `DELETE FROM companies WHERE id = $1`
	commandTag, err := s.client.Exec(ctx, query, companyID)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s *Storage) GetCompanyByID(ctx context.Context, userID, companyID uuid.UUID) (*domain.Company, error) {
	if !s.CheckPermission(ctx, userID, companyID, config.OwnerRole) {
		return nil, domain.ErrInsufficientPermissions
	}
	query := `SELECT id, name, created_at, updated_at FROM companies WHERE id = $1`
	rows, err := s.client.Query(ctx, query, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectOneRow(rows, pgx.RowToAddrOfStructByPos[domain.Company])
}

func (s *Storage) GetCompaniesOfUser(ctx context.Context, userID uuid.UUID) ([]*domain.CompanyWithUserRole, error) {
	query := `SELECT c.id, c.name, c.created_at, c.updated_at, cr.role
			  FROM companies c
			  JOIN company_roles cr ON c.id = cr.company_id
			  WHERE cr.user_id = $1`
	rows, err := s.client.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToAddrOfStructByPos[domain.CompanyWithUserRole])
}

func (s *Storage) AddUsersToCompany(ctx context.Context, userID, companyID uuid.UUID, userIDs []uuid.UUID) error {
	if !s.CheckPermission(ctx, userID, companyID, config.OwnerRole) {
		return domain.ErrInsufficientPermissions
	}
	query := `
        INSERT INTO company_roles (user_id, company_id, role)
        SELECT unnest($1::uuid[]), $2, 'member'
        ON CONFLICT (user_id, company_id) DO NOTHING
    `
	_, err := s.client.Exec(ctx, query, userIDs, companyID)
	return err
}
