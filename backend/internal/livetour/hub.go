package livetour

import (
	"fmt"
	"log"

	"github.com/gmohmad/diploma/pkg/maputil"
)

type Hub struct {
	sessions *maputil.AsyncMap[string, *Session]
}

func NewHub() *Hub {
	return &Hub{
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

	session := NewSession(sessionID, owner)
	h.sessions.Set(sessionID, session)
	go session.Run(h.sessions)
	log.Printf("session %s created. author - %s\n", session.id, owner.id)
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
	log.Printf("session %s was ended\n", session.id)
	return nil
}
