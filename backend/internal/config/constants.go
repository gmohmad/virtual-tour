package config

const (
	DataKey      = "data"
	UserIDKey    = "userId"
	CompanyIDKey = "companyId"
	TourIDkey    = "tourId"
	SessionIDKey = "sessionId"
	ClientIDKey  = "clientId"
	EmailKey     = "email"

	OwnerRole  = "owner"
	AdminRole  = "admin"
	MemberRole = "member"
)

var RolePriority = map[string]int{
	OwnerRole:  2,
	AdminRole:  1,
	MemberRole: 0,
}
