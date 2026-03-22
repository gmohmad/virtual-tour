package app

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/gmohmad/diploma/internal/models/dto"
	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/google/uuid"
)

type requestData struct {
	userID    uuid.UUID
	companyID uuid.UUID
	tourID    uuid.UUID
}

func parseTourReqFromMultipart(r *http.Request) (*dto.TourRequest, error) {
	data := r.FormValue(config.DataKey)
	if data == "" {
		return nil, fmt.Errorf("missing data part")
	}
	var req dto.TourRequest
	if err := json.NewDecoder(strings.NewReader(data)).Decode(&req); err != nil {
		return nil, fmt.Errorf("failed parsing json data: %w", err)
	}
	if req.Name == "" {
		return nil, fmt.Errorf("tour name is empty")
	}
	if len(req.Data.Nodes) != len(r.MultipartForm.File) {
		return nil, fmt.Errorf("amount of provided images not equal to amount of nodes")
	}
	return &req, nil
}

func parseCompanyReq(r *http.Request) (*dto.CompanyRequest, error) {
	var req dto.CompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, fmt.Errorf("Invalid requst body")
	}
	if req.Name == "" {
		return nil, fmt.Errorf("Company name cannot be empty")
	}
	return &req, nil
}

func getRequestData(r *http.Request, fields map[string]struct{}) (*requestData, error) {
	var rd requestData
	if _, ok := fields[config.UserIDKey]; ok {
		userID, err := common.GetUserIDFromContext(r.Context())
		if err != nil {
			return nil, domain.ErrUnathorized
		}
		rd.userID = userID
	}
	if _, ok := fields[config.CompanyIDKey]; ok {
		companyID, err := uuid.Parse(r.PathValue(config.CompanyIDKey))
		if err != nil {
			return nil, fmt.Errorf("Invalid companyID")
		}
		rd.companyID = companyID

	}
	if _, ok := fields[config.TourIDkey]; ok {
		tourID, err := uuid.Parse(r.PathValue(config.TourIDkey))
		if err != nil {
			return nil, fmt.Errorf("Invalid tourID")
		}
		rd.tourID = tourID
	}
	return &rd, nil
}
