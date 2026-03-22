package domain

import "fmt"

var (
	ErrUnathorized             = fmt.Errorf("unathorized")
	ErrInsufficientPermissions = fmt.Errorf("insufficient permissions")
)
