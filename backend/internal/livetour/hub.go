package livetour

import (
	"context"
	"fmt"
	"time"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/pkg/maputil"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

const sessionExpiry = time.Minute * 5

type Hub struct {
	cfg      *config.Config
	logger   *zap.Logger
	sessions *maputil.AsyncMap[uuid.UUID, *Session]
}

func (h *Hub) Run(ctx context.Context) {
	go h.cleanExpiredSessions(ctx)
}

func NewHub(cfg *config.Config, logger *zap.Logger) *Hub {
	return &Hub{
		cfg:      cfg,
		logger:   logger,
		sessions: maputil.NewAsyncMap[uuid.UUID, *Session](),
	}
}

func (h *Hub) ConnectToSession(sessionID uuid.UUID, client *Client) error {
	session, ok := h.sessions.Get(sessionID)
	if !ok {
		return fmt.Errorf("a session with provided id does not exist")
	}
	if err := session.AddClient(client); err != nil {
		return err
	}
	if client.id == session.ownerID {
		session.ownerJoinedAt = time.Now()
	}
	h.logger.Info("clients", zap.Any("", session.GetClientsAmount()))
	return nil
}

func (h *Hub) CreateSession(ownerID uuid.UUID) *Session {
	session := NewSession(h.logger, ownerID)
	go session.Run(h.sessions)
	h.sessions.Set(session.id, session)
	h.logger.Info("session created", zap.Any("session_id", session.id), zap.Any("owner_id", ownerID))
	return session
}

func (h *Hub) EndSession(userID, sessionID uuid.UUID) error {
	session, ok := h.sessions.Get(sessionID)
	if !ok {
		return fmt.Errorf("a session with the provider id doesnt exists")
	}
	if session.ownerID != userID {
		return fmt.Errorf("not enough permissions to end the session")
	}

	h.sessions.Del(sessionID)
	session.ShutDown()
	return nil
}

func (h *Hub) GetSession(sessionID uuid.UUID) (*Session, error) {
	session, ok := h.sessions.Get(sessionID)
	if !ok {
		return nil, fmt.Errorf("a session with the provider id doesnt exists")
	}
	return session, nil
}

func (h *Hub) cleanExpiredSessions(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			toDelete := make([]*Session, 0)
			h.sessions.Range(func(key uuid.UUID, sess *Session) {
				if _, ownerConnected := sess.clients.Get(sess.ownerID); time.Since(sess.ownerJoinedAt) >= sessionExpiry && !ownerConnected {
					toDelete = append(toDelete, sess)
				}
			})
			for _, session := range toDelete {
				session.ShutDown()
				h.sessions.Del(session.id)
			}
		}
	}
}
