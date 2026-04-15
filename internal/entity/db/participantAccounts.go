package db

import "time"

type ParticipantAccounts struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantAccountsAddRequest struct {
	ParticipantId int    `json:"participant_id"`
	PlatformName  string `json:"platform_name"`
	PlatformId    string `json:"platform_id"`
	PlatformLogin string `json:"platform_login"`
	IsFound       bool   `json:"is_found"`
}

type ParticipantAccountsEditRequest struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantAccountsDeleteRequest struct {
	Id int `json:"id"`
}

type ParticipantAccountsGetRequestById struct {
	ParticipantId int `json:"id"`
}
type ParticipantAccountsGetRequestByPlatform struct {
	PlatformName string `json:"platform_name"`
	PlatformId   string `json:"platform_id"`
}

type ParticipantAccountsAddResponse struct {
	Id int `json:"id"`
}

type ParticipantAccountsEditResponse struct{}

type ParticipantAccountsDeleteResponse struct{}

type ParticipantAccountsGetResponse struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}
