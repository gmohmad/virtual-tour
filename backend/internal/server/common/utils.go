package common

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/google/uuid"
)

func GetValFromQueryParams(key string, r *http.Request) (string, error) {
	value := r.URL.Query().Get(key)
	if value == "" {
		return "", fmt.Errorf("%s cant be empty", key)
	}
	return value, nil
}

func GetUserIDFromContext(ctx context.Context) (uuid.UUID, error) {
	userID, ok := ctx.Value(config.UserIDKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, fmt.Errorf("unauthorized")
	}
	return userID, nil
}

func WriteResponse(w http.ResponseWriter, msg string, code int) {
	w.WriteHeader(code)
	w.Write([]byte(msg))
}
