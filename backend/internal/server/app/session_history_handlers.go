package app

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/gmohmad/virtual-tour/internal/config"
	"github.com/gmohmad/virtual-tour/internal/models/dto"
	"github.com/gmohmad/virtual-tour/internal/server/common"
)

func (s *Server) handleGetSessionHistory(w http.ResponseWriter, r *http.Request) {
	userID, err := common.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	companyID, err := uuid.Parse(r.PathValue(config.CompanyIDKey))
	if err != nil {
		http.Error(w, "Invalid company id", http.StatusBadRequest)
		return
	}

	history, err := s.storage.GetSessionHistoryByCompany(r.Context(), userID, companyID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	resp := make([]dto.SessionHistoryResponse, 0, len(history))
	for _, h := range history {
		resp = append(resp, dto.SessionHistoryResponse{
			ID:                 h.ID,
			SessionID:          h.SessionID,
			TourID:             h.TourID,
			TourName:           h.TourName,
			OwnerID:            h.OwnerID,
			OwnerName:          h.OwnerName,
			StartedAt:          h.StartedAt,
			EndedAt:            h.EndedAt,
			DurationSeconds:    h.DurationSeconds,
			TotalClientsJoined: h.TotalClientsJoined,
			PeakClients:        h.PeakClients,
			BlacklistedCount:   h.BlacklistedCount,
			EndReason:          h.EndReason,
		})
	}

	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed writing response", http.StatusInternalServerError)
	}
}
