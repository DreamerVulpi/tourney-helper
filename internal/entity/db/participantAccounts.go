package db

import "time"

type ParticipantAccount struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantAccountAddRequest struct {
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantAccountEditRequest struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantAccountDeleteRequestByPlatform struct {
	ParticipantId int    `json:"participant_id"`
	PlatformName  string `json:"platform_name"`
	PlatformId    string `json:"platform_id"`
}

type ParticipantAccountsGetRequestById struct {
	ParticipantId int `json:"id"`
}
type ParticipantAccountGetRequestByPlatform struct {
	ParticipantId int    `json:"participant_id"`
	PlatformName  string `json:"platform_name"`
	PlatformId    string `json:"platform_id"`
}

type ParticipantAccountAddResponse struct {
	Id int `json:"id"`
}

type ParticipantAccountEditResponse struct{}

type ParticipantAccountDeleteResponse struct{}

type ParticipantAccountGetResponse struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}
