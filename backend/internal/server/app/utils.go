package app

import (
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/gmohmad/diploma/internal/config"
	"github.com/gmohmad/diploma/internal/models/domain"
	"github.com/gmohmad/diploma/internal/models/dto"
	"github.com/gmohmad/diploma/internal/server/common"
	"github.com/google/uuid"
)

const maxMultipartMemory = 50 << 20 // 50mb

type requestData struct {
	userID    uuid.UUID
	companyID uuid.UUID
	tourID    uuid.UUID
}

func parseTourReqFromMultipart(r *http.Request, checkLen bool) (*dto.TourRequest, error) {
	if err := r.ParseMultipartForm(maxMultipartMemory); err != nil {
		return nil, fmt.Errorf("failed to parse form: %w", err)
	}
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
	if checkLen && len(req.Data.Nodes) != len(r.MultipartForm.File) {
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

func getNodesMap(nodes []*domain.TourNode) map[string]*domain.TourNode {
	out := make(map[string]*domain.TourNode, len(nodes))
	for _, node := range nodes {
		out[node.ID] = node
	}
	return out
}

func getImagesToUpload(newNodes []*domain.TourNode, form *multipart.Form) map[string][]*multipart.FileHeader {
	toUpload := make(map[string][]*multipart.FileHeader, 0)
	for _, node := range newNodes {
		if headers, ok := form.File[node.ID]; ok {
			toUpload[node.ID] = headers
		}
	}
	return toUpload
}

func getImagesToDelete(oldNodes, newNodes []*domain.TourNode, form *multipart.Form) []string {
	toDelete := make([]string, 0)
	reqNodesMap := getNodesMap(newNodes)
	for _, node := range oldNodes {
		reqNode, ok := reqNodesMap[node.ID]
		_, isInMultipart := form.File[node.ID]
		if !ok || (node.Panorama != reqNode.Panorama || isInMultipart) {
			toDelete = append(toDelete, node.Panorama)
		}
	}
	return toDelete
}

func updNodePanoramaPaths(nodes []*domain.TourNode, uploaded map[string]string) {
	for _, node := range nodes {
		if newPath, ok := uploaded[node.ID]; ok {
			node.Panorama = newPath
		}
	}
}
