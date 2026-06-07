package storage

import (
	"context"
	"time"

	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/models/domain"
	"github.com/google/uuid"
)

type SessionHistoryInput struct {
	SessionID          uuid.UUID
	TourID             uuid.UUID
	OwnerID            uuid.UUID
	StartedAt          time.Time
	EndedAt            time.Time
	TotalClientsJoined int
	PeakClients        int
	BlacklistedCount   int
	EndReason          string
}

func (s *Storage) SaveSessionHistory(ctx context.Context, input SessionHistoryInput) error {
	duration := int(input.EndedAt.Sub(input.StartedAt).Seconds())
	if duration < 0 {
		duration = 0
	}
	query := `INSERT INTO session_history
		(session_id, tour_id, owner_id, started_at, ended_at, duration_seconds,
		 total_clients_joined, peak_clients, blacklisted_count, end_reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := s.client.Exec(ctx, query,
		input.SessionID, input.TourID, input.OwnerID, input.StartedAt, input.EndedAt, duration,
		input.TotalClientsJoined, input.PeakClients, input.BlacklistedCount, input.EndReason,
	)
	return err
}

func (s *Storage) GetSessionHistoryByCompany(ctx context.Context, userID, companyID uuid.UUID) ([]domain.SessionHistory, error) {
	if !s.CheckPermission(ctx, userID, companyID, config.MemberRole) {
		return nil, domain.ErrInsufficientPermissions
	}
	query := `SELECT sh.id, sh.session_id, sh.tour_id, t.name, sh.owner_id, u.name,
		sh.started_at, sh.ended_at, sh.duration_seconds,
		sh.total_clients_joined, sh.peak_clients, sh.blacklisted_count, sh.end_reason
		FROM session_history sh
		JOIN tours t ON t.id = sh.tour_id
		JOIN users u ON u.id = sh.owner_id
		WHERE t.company_id = $1
		ORDER BY sh.ended_at DESC
		LIMIT 100`
	rows, err := s.client.Query(ctx, query, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.SessionHistory
	for rows.Next() {
		var h domain.SessionHistory
		if err := rows.Scan(
			&h.ID, &h.SessionID, &h.TourID, &h.TourName, &h.OwnerID, &h.OwnerName,
			&h.StartedAt, &h.EndedAt, &h.DurationSeconds,
			&h.TotalClientsJoined, &h.PeakClients, &h.BlacklistedCount, &h.EndReason,
		); err != nil {
			return nil, err
		}
		out = append(out, h)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if out == nil {
		out = []domain.SessionHistory{}
	}
	return out, nil
}
