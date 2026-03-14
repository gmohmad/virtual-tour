package postgres

import (
	"fmt"
	"log"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func Migrate(cfg *config.DB) error {
	db := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName, cfg.SSLMode,
	)
	source := fmt.Sprintf("file://%s", cfg.MigrationsPath)
	m, err := migrate.New(source, db)
	if err != nil {
		return fmt.Errorf("failed instantiating migrate.Migrate: %w", err)
	}

	log.Println("Applying UP migrations...")
	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			log.Println("No change in migrations to apply")
			return nil
		}
		return fmt.Errorf("failed applying UP migrations: %w", err)
	}

	return nil
}
