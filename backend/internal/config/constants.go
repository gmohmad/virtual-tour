package config

const (
	SessionIDKey = "session_id"
	ClientIDKey  = "client_id"
	UserIDKey    = "userID"

	OwnerRole  = "owner"
	AdminRole  = "admin"
	MemberRole = "member"
)

var RolePriority = map[string]int{
	OwnerRole:  2,
	AdminRole:  1,
	MemberRole: 0,
}
