package ws

import (
	"fmt"
	"net/http"
)

func getValFromQueryParams(key string, r *http.Request) (string, error) {
	value := r.URL.Query().Get(key)
	if value == "" {
		return "", fmt.Errorf("%s cant be empty", key)
	}
	return value, nil
}

func writeResponse(w http.ResponseWriter, msg string, code int) {
	w.WriteHeader(code)
	w.Write([]byte(msg))
}
