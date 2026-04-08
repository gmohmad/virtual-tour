package common

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/gmohmad/virtual-tour/internal/auth"
	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/models/domain"
)

func GetUserIDFromRequestToken(r *http.Request) (uuid.UUID, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return uuid.Nil, fmt.Errorf("missing authorization header")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return uuid.Nil, fmt.Errorf("invalid authorization header format")
	}

	claims, err := auth.ValidateToken(parts[1])
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid token")
	}

	return claims.UserID, nil
}

func GetUserIDFromContext(ctx context.Context) (uuid.UUID, error) {
	userID, ok := ctx.Value(config.UserIDKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, domain.ErrUnathorized
	}
	return userID, nil
}

func WriteResponse(w http.ResponseWriter, msg string, code int) {
	w.WriteHeader(code)
	w.Write([]byte(msg))
}
