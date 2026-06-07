package dto

import (
	"time"

	"github.com/google/uuid"
)

type SessionHistoryResponse struct {
	ID                 uuid.UUID `json:"id"`
	SessionID          uuid.UUID `json:"session_id"`
	TourID             uuid.UUID `json:"tour_id"`
	TourName           string    `json:"tour_name"`
	OwnerID            uuid.UUID `json:"owner_id"`
	OwnerName          string    `json:"owner_name"`
	StartedAt          time.Time `json:"started_at"`
	EndedAt            time.Time `json:"ended_at"`
	DurationSeconds    int       `json:"duration_seconds"`
	TotalClientsJoined int       `json:"total_clients_joined"`
	PeakClients        int       `json:"peak_clients"`
	BlacklistedCount   int       `json:"blacklisted_count"`
	EndReason          string    `json:"end_reason"`
}

type CreateSessionRequest struct {
	TourID uuid.UUID `json:"tour_id"`
}

type BlacklistEntryResponse struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"display_name"`
}
