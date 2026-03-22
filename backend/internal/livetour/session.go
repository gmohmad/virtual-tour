package livetour

import (
	"fmt"
	"time"

	"github.com/gmohmad/diploma/pkg/maputil"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

type Session struct {
	id         uuid.UUID
	ownerID    uuid.UUID
	clients    *maputil.AsyncMap[uuid.UUID, *Client]
	incoming   chan clientMessage
	unregister chan *Client
	shutdown   chan struct{}
	logger     *zap.Logger
}

func NewSession(logger *zap.Logger, ownerID uuid.UUID) *Session {
	s := &Session{
		id:         uuid.New(),
		ownerID:    ownerID,
		incoming:   make(chan clientMessage, 100),
		unregister: make(chan *Client, 100),
		shutdown:   make(chan struct{}),
		clients:    maputil.NewAsyncMap[uuid.UUID, *Client](),
		logger:     logger,
	}
	return s
}

func (s *Session) GetID() uuid.UUID {
	return s.id
}

func (s *Session) GetOwnerID() uuid.UUID {
	return s.ownerID
}

func (s *Session) GetClientsAmount() int {
	return s.clients.Len()
}

func (s *Session) Run(hubSessions *maputil.AsyncMap[uuid.UUID, *Session]) {
	pingTicker := time.NewTicker(pingPeriod)
	defer pingTicker.Stop()

	for {
		select {
		case client := <-s.unregister:
			client.close()
			s.clients.Del(client.id)
			if client.id == s.ownerID {
				s.Close()
				hubSessions.Del(s.id)
				s.logger.Info("owner disconnected, ending session", zap.Any("owner_id", s.ownerID), zap.Any("session_id", s.id))
				return
			} else {
				s.logger.Info("client disconnected", zap.Any("id", client.id))
			}

		case msg := <-s.incoming:
			if msg.ClientID == s.ownerID {
				s.broadcast(msg.Data, false)
			}

		case <-pingTicker.C:
			s.ping()
		}
	}
}

func (s *Session) AddClient(client *Client) error {
	_, ok := s.clients.Get(client.id)
	if ok {
		return fmt.Errorf("a client with provided id is already connected")
	}

	s.clients.Set(client.id, client)
	go client.poll(s.shutdown, s.incoming, s.unregister)
	s.logger.Info("client connected to session", zap.Any("client_id", client.id), zap.Any("session_id", s.id))
	return nil
}

func (s *Session) ShutDown() {
	s.shutdown <- struct{}{}
}

func (s *Session) Close() {
	s.clients.Range(func(key uuid.UUID, value *Client) { value.close() })
	s.clients.Reset()
	close(s.incoming)
	close(s.unregister)
}

func (s *Session) broadcast(message []byte, skipOwner bool) {
	var failed []*Client
	s.clients.Range(func(key uuid.UUID, value *Client) {
		if skipOwner && key == s.ownerID {
			return
		}
		if err := value.writeMessage(message); err != nil {
			s.logger.Error("failed to broadcast to client", zap.Any("client_id", key), zap.Error(err))
			failed = append(failed, value)
		}
	})
	for _, f := range failed {
		f.close()
	}
}

func (s *Session) ping() {
	var failed []*Client
	s.clients.Range(func(key uuid.UUID, value *Client) {
		if err := value.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(writeWait)); err != nil {
			s.logger.Error("ping failed for client", zap.Any("client_id", key), zap.Error(err))
			failed = append(failed, value)
		}
	})
	for _, f := range failed {
		f.close()
	}
}
