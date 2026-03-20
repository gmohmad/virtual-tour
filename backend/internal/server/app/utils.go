package app

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strings"

	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/gmohmad/diploma/internal/models/dto"
)

func parseTourReqFromMultipart[T dto.TourRequest](r *http.Request) (*T, error) {
	data := r.FormValue("data")
	if data == "" {
		return nil, fmt.Errorf("missing data part")
	}
	var req T
	if err := json.NewDecoder(strings.NewReader(data)).Decode(&req); err != nil {
		return nil, fmt.Errorf("failed parsing json data: %w", err)
	}
	if req.GetName() == "" {
		return nil, fmt.Errorf("tour name is empty")
	}
	if len(req.GetData().Nodes) != len(r.MultipartForm.File) {
		return nil, fmt.Errorf("amount of provided file not equal to amount of nodes")
	}
	return &req, nil
}

func updateImagePaths(address string, tourData *domain.TourData) {
	for _, node := range tourData.Nodes {
		node.Panorama = path.Join(address, node.Panorama)
	}
}
