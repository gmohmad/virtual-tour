package livetour

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/google/uuid"

	"github.com/gmohmad/virtual-tour/internal/config"
	livetour "github.com/gmohmad/virtual-tour/internal/livetour"
	"github.com/gmohmad/virtual-tour/internal/models/dto"
	"github.com/gmohmad/virtual-tour/internal/server/common"
)

func (s *Server) handleCreateSession(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var req dto.CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.TourID == uuid.Nil {
		http.Error(w, "tour_id is required", http.StatusBadRequest)
		return
	}

	session := s.hub.CreateSession(userID, req.TourID)
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(dto.SessionResponse{
		ID:      session.GetID(),
		OwnerID: session.GetOwnerID(),
	}); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleEndSession(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	sessionID, err := uuid.Parse(r.PathValue(config.SessionIDKey))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := s.hub.EndSession(userID, sessionID); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}
	common.WriteResponse(w, "session ended", http.StatusOK)
}

func (s *Server) handleGetSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := uuid.Parse(r.PathValue(config.SessionIDKey))
	if err != nil {
		http.Error(w, "Invalid session id", http.StatusBadRequest)
		return
	}
	session, err := s.hub.GetSession(sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	clients := make([]dto.Client, 0, session.GetClientsAmount())
	for _, client := range session.GetClients() {
		clients = append(clients, dto.Client{
			ID:          client.GetID(),
			DisplayName: client.GetDisplayName(),
			MicMuted:    client.GetMicMuted(),
			ServerMuted: client.GetServerMuted(),
			IsOwner:     client.GetID() == session.GetOwnerID(),
		})
	}
	if err := json.NewEncoder(w).Encode(dto.SessionResponse{
		ID:      session.GetID(),
		OwnerID: session.GetOwnerID(),
		Clients: clients,
	}); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleGetBlacklist(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	sessionID, err := uuid.Parse(r.PathValue(config.SessionIDKey))
	if err != nil {
		http.Error(w, "Invalid session id", http.StatusBadRequest)
		return
	}

	entries, err := s.hub.GetSessionBlacklist(sessionID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	resp := make([]dto.BlacklistEntryResponse, 0, len(entries))
	for _, e := range entries {
		resp = append(resp, dto.BlacklistEntryResponse{
			ID:          e.ID,
			DisplayName: e.DisplayName,
		})
	}
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}

func (s *Server) handleRemoveFromBlacklist(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	sessionID, err := uuid.Parse(r.PathValue(config.SessionIDKey))
	if err != nil {
		http.Error(w, "Invalid session id", http.StatusBadRequest)
		return
	}
	clientID, err := uuid.Parse(r.PathValue(config.ClientIDKey))
	if err != nil {
		http.Error(w, "Invalid client id", http.StatusBadRequest)
		return
	}

	if err := s.hub.RemoveFromBlacklist(sessionID, userID, clientID); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}
	common.WriteResponse(w, "removed from blacklist", http.StatusOK)
}

func (s *Server) handleConnectToSession(w http.ResponseWriter, r *http.Request) {
	clientID, err := uuid.Parse(r.URL.Query().Get(config.ClientIDKey))
	if err != nil {
		http.Error(w, "Invalid client id", http.StatusBadRequest)
		return
	}

	sessionID, err := uuid.Parse(r.PathValue(config.SessionIDKey))
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	displayName := r.URL.Query().Get("displayName")
	client := livetour.NewClient(s.logger, clientID, conn, displayName)
	if err := s.hub.ConnectToSession(sessionID, client); err != nil {
		errMsg := err.Error()
		if errors.Is(err, livetour.ErrBlacklisted) {
			errMsg = "blacklisted"
		}
		conn.WriteJSON(map[string]string{
			"type":  "error",
			"error": errMsg,
		})
		conn.Close()
		return
	}
}
