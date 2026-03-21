package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

const (
	maxRetries = 5
	delay      = 3
)

type Client interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Begin(context.Context) (pgx.Tx, error)
	Close()
}

func NewClient(ctx context.Context, cfg *config.DB, logger *zap.Logger) (pool Client, err error) {
	dsn := fmt.Sprintf(
		"postgresql://%s:%s@%s/%s?sslmode=%s",
		cfg.User, cfg.Password, cfg.Host, cfg.DBName, cfg.SSLMode,
	)

	for i := range maxRetries {

		attemptCtx, cancel := context.WithTimeout(ctx, time.Second*5)
		defer cancel()

		pool, err = pgxpool.New(attemptCtx, dsn)

		if err == nil {
			return pool, nil
		}

		logger.Error(
			"failed to connect to the database",
			zap.String("attempt", fmt.Sprintf("%d/%d", i+1, maxRetries)),
			zap.Error(err),
		)
		time.Sleep(time.Second * delay)

	}
	return nil, fmt.Errorf("Failed to connect to the database after %d attempts: %w", maxRetries, err)
}
