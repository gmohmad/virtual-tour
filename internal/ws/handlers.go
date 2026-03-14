package ws

import (
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	livetour "github.com/gmohmad/diploma/internal/live_tour"
)

func (s *WSServer) handleCreateSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := getValFromQueryParams(config.SessionIDKey, r)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	clientID, err := getValFromQueryParams(config.ClientIDKey, r)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s.hub.CreateSession(sessionID, livetour.NewClient(clientID, conn))
	// writeResponse(w, "session created", http.StatusOK)
}

func (s *WSServer) handleEndSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := getValFromQueryParams(config.SessionIDKey, r)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	clientID, err := getValFromQueryParams(config.ClientIDKey, r)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	s.hub.EndSession(sessionID, clientID)
	// writeResponse(w, "session ended", http.StatusOK)
}

func (s *WSServer) handleConnectToSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := getValFromQueryParams(config.SessionIDKey, r)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	clientID, err := getValFromQueryParams(config.ClientIDKey, r)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		writeResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	client := livetour.NewClient(clientID, conn)
	if err := s.hub.ConnectToSession(sessionID, client); err != nil {
		writeResponse(w, err.Error(), http.StatusForbidden)
		return
	}
	// writeResponse(w, "successfully connected to session", http.StatusOK)
}
