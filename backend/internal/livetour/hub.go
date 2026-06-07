package livetour

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/storage"
	"github.com/gmohmad/virtual-tour/pkg/maputil"
)

const sessionExpiry = time.Minute * 5

type Hub struct {
	cfg          *config.Config
	logger       *zap.Logger
	sessions     *maputil.AsyncMap[uuid.UUID, *Session]
	historySaver *storage.Storage
}

func (h *Hub) Run(ctx context.Context) {
	go h.cleanExpiredSessions(ctx)
}

func NewHub(cfg *config.Config, logger *zap.Logger, historySaver *storage.Storage) *Hub {
	return &Hub{
		cfg:          cfg,
		logger:       logger,
		sessions:     maputil.NewAsyncMap[uuid.UUID, *Session](),
		historySaver: historySaver,
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
	return nil
}

func (h *Hub) CreateSession(ownerID, tourID uuid.UUID) *Session {
	session := NewSession(h.logger, ownerID, tourID, h.historySaver)
	go session.Run(h.sessions)
	h.sessions.Set(session.id, session)
	h.logger.Info("session created", zap.Any("session_id", session.id), zap.Any("owner_id", ownerID), zap.Any("tour_id", tourID))
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

func (h *Hub) GetSessionBlacklist(sessionID, userID uuid.UUID) ([]struct {
	ID          uuid.UUID
	DisplayName string
}, error) {
	session, err := h.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	if session.ownerID != userID {
		return nil, fmt.Errorf("not enough permissions")
	}
	return session.GetBlacklist(), nil
}

func (h *Hub) RemoveFromBlacklist(sessionID, userID, clientID uuid.UUID) error {
	session, err := h.GetSession(sessionID)
	if err != nil {
		return err
	}
	if session.ownerID != userID {
		return fmt.Errorf("not enough permissions")
	}
	if !session.RemoveFromBlacklist(clientID) {
		return fmt.Errorf("client not on blacklist")
	}
	return nil
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
				session.ShutDownExpired()
				h.sessions.Del(session.id)
			}
		}
	}
}
