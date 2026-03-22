package livetour

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

const (
	maxMessageSize = 512
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = 30 * time.Second
)

type Client struct {
	id     uuid.UUID
	conn   *websocket.Conn
	logger *zap.Logger
}

type clientMessage struct {
	ClientID uuid.UUID
	Data     []byte
}

func NewClient(logger *zap.Logger, id uuid.UUID, conn *websocket.Conn) *Client {
	return &Client{
		id:     id,
		conn:   conn,
		logger: logger,
	}
}

func (c *Client) writeMessage(message []byte) error {
	c.conn.SetWriteDeadline(time.Now().Add(writeWait))
	w, err := c.conn.NextWriter(websocket.TextMessage)
	if err != nil {
		return fmt.Errorf("failed to get a writer: %w", err)
	}
	defer w.Close()

	if _, err := w.Write(message); err != nil {
		return fmt.Errorf("failed writing message to conn: %w", err)
	}
	return nil
}

func (c *Client) poll(shutdown chan struct{}, incoming chan<- clientMessage, unregister chan<- *Client) {
	defer func() {
		unregister <- c
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			return
		}
		select {
		case incoming <- clientMessage{ClientID: c.id, Data: message}:
		case <-shutdown:
			return
		}
	}
}

func (c *Client) close() error {
	return c.conn.Close()
}
