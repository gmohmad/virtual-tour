package livetour

import (
	"fmt"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/pkg/maputil"
	"go.uber.org/zap"
)

type Hub struct {
	cfg      *config.Config
	logger   *zap.Logger
	sessions *maputil.AsyncMap[string, *Session]
}

func NewHub(cfg *config.Config, logger *zap.Logger) *Hub {
	return &Hub{
		cfg:      cfg,
		logger:   logger,
		sessions: maputil.NewAsyncMap[string, *Session](),
	}
}

func (h *Hub) ConnectToSession(sessionID string, client *Client) error {
	session, ok := h.sessions.Get(sessionID)
	if !ok {
		return fmt.Errorf("a session with provided id does not exist")
	}
	return session.AddClient(client)
}

func (h *Hub) CreateSession(sessionID string, owner *Client) error {
	_, ok := h.sessions.Get(sessionID)
	if ok {
		return fmt.Errorf("a session with the provider id already exists")
	}

	session := NewSession(h.logger, sessionID, owner)
	h.sessions.Set(sessionID, session)
	go session.Run(h.sessions)
	h.logger.Info("session created", zap.String("session_id", sessionID), zap.String("owner_id", owner.id))
	return nil
}

func (h *Hub) EndSession(sessionID, clientID string) error {
	session, ok := h.sessions.Get(sessionID)
	if !ok {
		return fmt.Errorf("a session with the provider id doesnt exists")
	}
	if session.owner.id != clientID {
		return fmt.Errorf("not enough permissions to end the session")
	}

	h.sessions.Del(sessionID)
	session.ShutDown()
	h.logger.Info("session ended", zap.String("id", session.id))
	return nil
}
