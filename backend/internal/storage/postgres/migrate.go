package postgres

import (
	"fmt"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"go.uber.org/zap"
)

func Migrate(cfg *config.DB, logger *zap.Logger) error {
	db := fmt.Sprintf(
		"postgres://%s:%s@%s/%s?sslmode=%s",
		cfg.User, cfg.Password, cfg.Host, cfg.DBName, cfg.SSLMode,
	)
	source := fmt.Sprintf("file://%s", cfg.MigrationsPath)
	m, err := migrate.New(source, db)
	if err != nil {
		return fmt.Errorf("failed instantiating migrate.Migrate: %w", err)
	}

	logger.Info("applying UP migrations")
	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			logger.Info("no change in migrations to apply")
			return nil
		}
		return fmt.Errorf("failed applying UP migrations: %w", err)
	}

	return nil
}
