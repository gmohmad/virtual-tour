package livetour

import (
	"fmt"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	maxMessageSize = 512
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
)

type Client struct {
	id   string
	conn *websocket.Conn
}

func NewClient(id string, conn *websocket.Conn) *Client {
	return &Client{
		id:   id,
		conn: conn,
	}
}

func (c *Client) writeMessage(message []byte) error {
	c.conn.SetWriteDeadline(time.Now().Add(writeWait))
	w, err := c.conn.NextWriter(websocket.TextMessage)
	if err != nil {
		return fmt.Errorf("failed to get a writer: %w", err)
	}

	if _, err := w.Write(message); err != nil {
		return fmt.Errorf("failed writing message to conn: %w", err)
	}

	if err := w.Close(); err != nil {
		return fmt.Errorf("failed closing writer: %w", err)
	}
	return nil
}

func (c *Client) poll(shutdown chan struct{}, broadcast chan []byte) {
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			return
		}
		select {
		case <-shutdown:
			return
		case broadcast <- message:
		}
	}
}
