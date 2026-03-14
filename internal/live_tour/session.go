package livetour

import (
	"fmt"
	"log"
	"time"

	"github.com/gmohmad/diploma/pkg/maputil"
	"github.com/gorilla/websocket"
)

type Session struct {
	id         string
	owner      *Client
	clients    *maputil.AsyncMap[string, *Client]
	incoming   chan clientMessage
	unregister chan *Client
	shutdown   chan struct{}
}

func NewSession(id string, owner *Client) *Session {
	s := &Session{
		id:         id,
		owner:      owner,
		incoming:   make(chan clientMessage, 100),
		unregister: make(chan *Client, 100),
		shutdown:   make(chan struct{}),
		clients:    maputil.NewAsyncMap[string, *Client](),
	}
	s.AddClient(owner)
	return s
}

func (s *Session) Run() {
	pingTicker := time.NewTicker(pingPeriod)
	defer pingTicker.Stop()

	for {
		select {
		case <-s.shutdown:
			s.Close()
			return

		case client := <-s.unregister:
			s.clients.Del(client.id)
			client.close()
			if client.id == s.owner.id {
				log.Printf("Owner %s disconnected, ending session %s", client.id, s.id)
				s.ShutDown()
			} else {
				s.broadcast([]byte(`{"type":"user_left","clientId":"`+client.id+`"}`), true)
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
	return nil
}

func (s *Session) ShutDown() {
	select {
	case s.shutdown <- struct{}{}:
	default:
	}
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
			log.Printf("failed to broadcast to client %s: %v", key, err)
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
			log.Printf("ping failed for client %s: %v", key, err)
			failed = append(failed, value)
		}
	})
	for _, f := range failed {
		f.close()
	}
}
