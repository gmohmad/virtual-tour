package livetour

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gmohmad/diploma/pkg/maputil"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

type Session struct {
	id            uuid.UUID
	ownerID       uuid.UUID
	clients       *maputil.AsyncMap[uuid.UUID, *Client]
	ownerJoinedAt time.Time

	incoming   chan clientMessage
	unregister chan *Client
	shutdown   chan struct{}
	logger     *zap.Logger
}

type participantDTO struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"display_name"`
	MicMuted    bool      `json:"mic_muted"`
	ServerMuted bool      `json:"server_muted"`
	IsOwner     bool      `json:"is_owner"`
}

func NewSession(logger *zap.Logger, ownerID uuid.UUID) *Session {
	s := &Session{
		id:            uuid.New(),
		ownerID:       ownerID,
		ownerJoinedAt: time.Now(),
		incoming:      make(chan clientMessage, 1024),
		unregister:    make(chan *Client, 100),
		shutdown:      make(chan struct{}),
		clients:       maputil.NewAsyncMap[uuid.UUID, *Client](),
		logger:        logger,
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

func (s *Session) GetClients() []*Client {
	out := make([]*Client, 0, s.clients.Len())
	s.clients.Range(func(key uuid.UUID, value *Client) {
		out = append(out, value)
	})
	return out
}

func (s *Session) Run(hubSessions *maputil.AsyncMap[uuid.UUID, *Session]) {
	pingTicker := time.NewTicker(pingPeriod)
	defer pingTicker.Stop()

	for {
		select {
		case <-s.shutdown:
			s.Close()
			s.logger.Info("session ended", zap.Any("session_id", s.id))
			return

		case client := <-s.unregister:
			client.close()
			s.clients.Del(client.id)
			if client.id == s.ownerID {
				s.logger.Info("owner disconnected", zap.Any("owner_id", s.ownerID))
			} else {
				s.logger.Info("client disconnected", zap.Any("id", client.id))
			}
			s.broadcastParticipantLeft(client.id)

		case msg := <-s.incoming:
			s.handleIncoming(msg)

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

	s.sendSessionSync(client)
	s.broadcastParticipantJoined(client)
	s.logger.Info("client connected to session", zap.Any("client_id", client.id), zap.Any("session_id", s.id))
	return nil
}

func (s *Session) participantDTO(c *Client) participantDTO {
	return participantDTO{
		ID:          c.id,
		DisplayName: c.displayName,
		MicMuted:    c.micMuted,
		ServerMuted: c.serverMuted,
		IsOwner:     c.id == s.ownerID,
	}
}

func (s *Session) sendSessionSync(c *Client) {
	participants := make([]participantDTO, 0, s.clients.Len())
	s.clients.Range(func(_ uuid.UUID, v *Client) {
		participants = append(participants, s.participantDTO(v))
	})
	msg, err := json.Marshal(map[string]any{
		"type":          "session_sync",
		"self_id":       c.id,
		"owner_id":      s.ownerID,
		"participants":  participants,
		"session_id":    s.id,
	})
	if err != nil {
		s.logger.Error("session_sync marshal", zap.Error(err))
		return
	}
	if err := c.writeMessage(msg); err != nil {
		s.logger.Error("session_sync write", zap.Error(err))
	}
}

func (s *Session) broadcastParticipantJoined(c *Client) {
	payload, err := json.Marshal(map[string]any{
		"type":        "participant_joined",
		"participant": s.participantDTO(c),
	})
	if err != nil {
		return
	}
	s.broadcastExcept(payload, c.id)
}

func (s *Session) broadcastParticipantLeft(id uuid.UUID) {
	payload, err := json.Marshal(map[string]any{
		"type":      "participant_left",
		"client_id": id,
	})
	if err != nil {
		return
	}
	s.broadcastAll(payload)
}

func (s *Session) broadcastParticipantUpdated(c *Client) {
	payload, err := json.Marshal(map[string]any{
		"type":        "participant_updated",
		"participant": s.participantDTO(c),
	})
	if err != nil {
		return
	}
	s.broadcastAll(payload)
}

func (s *Session) ShutDown() {
	s.broadcastExcept([]byte(`{"type":"session_ended"}`), s.ownerID)
	s.shutdown <- struct{}{}
}

func (s *Session) Close() {
	s.clients.Range(func(key uuid.UUID, value *Client) { _ = value.close() })
	s.clients.Reset()
	close(s.incoming)
	close(s.unregister)
}

func (s *Session) broadcastExcept(message []byte, except uuid.UUID) {
	var failed []*Client
	s.clients.Range(func(key uuid.UUID, value *Client) {
		if key == except {
			return
		}
		if err := value.writeMessage(message); err != nil {
			s.logger.Error("failed to broadcast to client", zap.Any("client_id", key), zap.Error(err))
			failed = append(failed, value)
		}
	})
	for _, f := range failed {
		_ = f.close()
	}
}

func (s *Session) broadcastAll(message []byte) {
	var failed []*Client
	s.clients.Range(func(key uuid.UUID, value *Client) {
		if err := value.writeMessage(message); err != nil {
			s.logger.Error("failed to broadcast to client", zap.Any("client_id", key), zap.Error(err))
			failed = append(failed, value)
		}
	})
	for _, f := range failed {
		_ = f.close()
	}
}

func (s *Session) handleIncoming(msg clientMessage) {
	var envelope struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(msg.Data, &envelope); err != nil {
		return
	}

	switch envelope.Type {
	case "state":
		s.broadcastExcept(msg.Data, msg.ClientID)
	case "webrtc_offer", "webrtc_answer", "webrtc_ice":
		if err := s.forwardWebRTC(msg.Data, msg.ClientID); err != nil {
			s.logger.Debug("webrtc forward", zap.Error(err))
		}
	case "mic_state":
		s.handleMicState(msg.Data, msg.ClientID)
	case "moderation_kick":
		s.handleModerationKick(msg.Data, msg.ClientID)
	case "moderation_mute":
		s.handleModerationMute(msg.Data, msg.ClientID)
	default:
	}
}

func (s *Session) forwardWebRTC(payload []byte, from uuid.UUID) error {
	var env struct {
		To string `json:"to"`
	}
	if err := json.Unmarshal(payload, &env); err != nil {
		return err
	}
	target, err := uuid.Parse(env.To)
	if err != nil {
		return err
	}
	recv, ok := s.clients.Get(target)
	if !ok {
		return fmt.Errorf("peer not connected")
	}

	var raw map[string]any
	if err := json.Unmarshal(payload, &raw); err != nil {
		return err
	}
	raw["from"] = from.String()
	out, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	return recv.writeMessage(out)
}

func (s *Session) handleMicState(payload []byte, clientID uuid.UUID) {
	var body struct {
		Muted bool `json:"muted"`
	}
	if err := json.Unmarshal(payload, &body); err != nil {
		return
	}
	c, ok := s.clients.Get(clientID)
	if !ok {
		return
	}
	c.SetMicMuted(body.Muted)
	s.broadcastParticipantUpdated(c)
}

func (s *Session) handleModerationKick(payload []byte, actorID uuid.UUID) {
	if actorID != s.ownerID {
		return
	}
	var body struct {
		TargetID uuid.UUID `json:"target_id"`
	}
	if err := json.Unmarshal(payload, &body); err != nil {
		return
	}
	if body.TargetID == s.ownerID {
		return
	}
	s.kickClient(body.TargetID)
}

func (s *Session) handleModerationMute(payload []byte, actorID uuid.UUID) {
	if actorID != s.ownerID {
		return
	}
	var body struct {
		TargetID uuid.UUID `json:"target_id"`
		Muted    bool      `json:"muted"`
	}
	if err := json.Unmarshal(payload, &body); err != nil {
		return
	}
	if body.TargetID == s.ownerID {
		return
	}
	target, ok := s.clients.Get(body.TargetID)
	if !ok {
		return
	}
	target.SetServerMuted(body.Muted)
	if body.Muted {
		target.SetMicMuted(true)
	}
	s.broadcastParticipantUpdated(target)

	msg, _ := json.Marshal(map[string]any{
		"type":   "you_are_server_muted",
		"muted": body.Muted,
	})
	_ = target.writeMessage(msg)
}

func (s *Session) kickClient(targetID uuid.UUID) {
	c, ok := s.clients.Get(targetID)
	if !ok {
		return
	}
	msg, _ := json.Marshal(map[string]string{
		"type":   "kicked",
		"reason": "removed by host",
	})
	_ = c.writeMessage(msg)
	_ = c.close()
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
		_ = f.close()
	}
}
