package livetour

import (
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	livetour "github.com/gmohmad/diploma/internal/livetour"
	"github.com/gmohmad/diploma/internal/server/common"
)

func (s *Server) handleCreateSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := common.GetValFromQueryParams(config.SessionIDKey, r)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	clientID, err := common.GetValFromQueryParams(config.ClientIDKey, r)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := s.hub.CreateSession(sessionID, livetour.NewClient(clientID, conn)); err != nil {
		conn.WriteJSON(map[string]string{
			"type":  "error",
			"error": err.Error(),
		})
		conn.Close()
		return
	}
}

func (s *Server) handleEndSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := common.GetValFromQueryParams(config.SessionIDKey, r)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	clientID, err := common.GetValFromQueryParams(config.ClientIDKey, r)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	s.hub.EndSession(sessionID, clientID)
	common.WriteResponse(w, "session ended", http.StatusOK)
}

func (s *Server) handleConnectToSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := common.GetValFromQueryParams(config.SessionIDKey, r)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	clientID, err := common.GetValFromQueryParams(config.ClientIDKey, r)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		common.WriteResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	client := livetour.NewClient(clientID, conn)
	if err := s.hub.ConnectToSession(sessionID, client); err != nil {
		conn.WriteJSON(map[string]string{
			"type":  "error",
			"error": err.Error(),
		})
		conn.Close()
		return
	}
}
