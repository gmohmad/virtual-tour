package domain

import (
	"time"

	"github.com/google/uuid"
)

type SessionHistory struct {
	ID                 uuid.UUID
	SessionID          uuid.UUID
	TourID             uuid.UUID
	TourName           string
	OwnerID            uuid.UUID
	OwnerName          string
	StartedAt          time.Time
	EndedAt            time.Time
	DurationSeconds    int
	TotalClientsJoined int
	PeakClients        int
	BlacklistedCount   int
	EndReason          string
}
