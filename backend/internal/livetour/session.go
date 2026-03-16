package livetour

import (
	"fmt"
	"time"

	"github.com/gmohmad/diploma/pkg/maputil"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

type Session struct {
	id         string
	owner      *Client
	clients    *maputil.AsyncMap[string, *Client]
	incoming   chan clientMessage
	unregister chan *Client
	shutdown   chan struct{}
	logger     *zap.Logger
}

func NewSession(logger *zap.Logger, id string, owner *Client) *Session {
	s := &Session{
		id:         id,
		owner:      owner,
		incoming:   make(chan clientMessage, 100),
		unregister: make(chan *Client, 100),
		shutdown:   make(chan struct{}),
		clients:    maputil.NewAsyncMap[string, *Client](),
		logger:     logger,
	}
	s.AddClient(owner)
	return s
}

func (s *Session) Run(hubSessions *maputil.AsyncMap[string, *Session]) {
	pingTicker := time.NewTicker(pingPeriod)
	defer pingTicker.Stop()

	for {
		select {
		case client := <-s.unregister:
			client.close()
			s.clients.Del(client.id)
			if client.id == s.owner.id {
				s.Close()
				hubSessions.Del(s.id)
				s.logger.Info("owner disconnected, ending session", zap.String("owner_id", s.owner.id), zap.String("session_id", s.id))
				return
			} else {
				s.logger.Info("client disconnected", zap.String("id", client.id))
			}

		case msg := <-s.incoming:
			if msg.ClientID == s.owner.id {
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
	s.logger.Info("client connected to session", zap.String("client_id", client.id), zap.String("session_id", s.id))
	return nil
}

func (s *Session) ShutDown() {
	s.shutdown <- struct{}{}
}

func (s *Session) Close() {
	s.clients.Range(func(key string, value *Client) { value.close() })
	s.clients.Reset()
	close(s.incoming)
	close(s.unregister)
}

func (s *Session) broadcast(message []byte, skipOwner bool) {
	var failed []*Client
	s.clients.Range(func(key string, value *Client) {
		if skipOwner && key == s.owner.id {
			return
		}
		if err := value.writeMessage(message); err != nil {
			s.logger.Error("failed to broadcast to client", zap.String("client_id", key), zap.Error(err))
			failed = append(failed, value)
		}
	})
	for _, f := range failed {
		f.close()
	}
}

func (s *Session) ping() {
	var failed []*Client
	s.clients.Range(func(key string, value *Client) {
		if err := value.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(writeWait)); err != nil {
			s.logger.Error("ping failed for client", zap.String("client_id", key), zap.Error(err))
			failed = append(failed, value)
		}
	})
	for _, f := range failed {
		f.close()
	}
}
