package livetour

import (
	"fmt"
	"log"

	"github.com/gmohmad/diploma/pkg/maputil"
)

type Session struct {
	id         string
	owner      *Client
	clients    *maputil.AsyncMap[string, *Client]
	broadcast  chan []byte
	unregister chan *Client
	shutdown   chan struct{}
}

func NewSession(id string, owner *Client) *Session {
	return &Session{
		id:         id,
		owner:      owner,
		broadcast:  make(chan []byte),
		unregister: make(chan *Client),
		shutdown:   make(chan struct{}),
		clients:    maputil.NewAsyncMap[string, *Client](),
	}
}

func (s *Session) Run() {
	go s.owner.poll(s.shutdown, s.broadcast)
	for {
		select {
		case <-s.shutdown:
			s.Close()
			return
		case client := <-s.unregister:
			s.clients.Del(client.id)
		case message := <-s.broadcast:
			s.clients.Range(func(key string, value *Client) {
				if err := value.writeMessage(message); err != nil {
					log.Println(err)
				}
			})
		}
	}
}

func (s *Session) AddClient(client *Client) error {
	_, ok := s.clients.Get(client.id)
	if ok || s.owner.id == client.id {
		return fmt.Errorf("a client with provided id is already connected")
	}

	s.clients.Set(client.id, client)
	return nil
}

func (s *Session) ShutDown() {
	s.shutdown <- struct{}{}
}

func (s *Session) Close() {
	close(s.broadcast)
	close(s.unregister)
	s.clients.Reset()
}
