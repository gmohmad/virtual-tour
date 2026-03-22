package dto

import "github.com/google/uuid"

type SessionResponse struct {
	ID         uuid.UUID `json:"id"`
	OwnerID    uuid.UUID `json:"owner_id"`
	ClientsLen int       `json:"clients_len"`
}
