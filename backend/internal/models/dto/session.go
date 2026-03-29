package dto

import "github.com/google/uuid"

type SessionResponse struct {
	ID      uuid.UUID `json:"id"`
	OwnerID uuid.UUID `json:"owner_id"`
	Clients []Client  `json:"clients"`
}

type Client struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"display_name"`
	MicMuted    bool      `json:"mic_muted"`
	ServerMuted bool      `json:"server_muted"`
	IsOwner     bool      `json:"is_owner"`
}
