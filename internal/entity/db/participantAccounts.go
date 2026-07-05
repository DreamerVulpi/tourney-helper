package db

import (
	"context"
	"time"
)

type ParticipantAccountsRepo interface {
	Add(
		ctx context.Context,
		participantId int,
		platformName string,
		platformId string,
		dmChannelId *string,
		platformLogin string,
		isFound bool) (int, error)
	Edit(
		ctx context.Context,
		participantId int,
		platformName string,
		platformId string,
		dmChannelId *string,
		platformLogin string,
		isFound bool) error
	EditDmChannel(
		ctx context.Context,
		participantId int,
		platformName string,
		dmChannelId *string) error
	DelByPlatform(
		ctx context.Context,
		participantId int,
		platformName string,
		platformId string) error
	GetById(ctx context.Context, id int) ([]ParticipantAccount, error)
	GetByLogin(
		ctx context.Context,
		platformName string,
		platformLogin string,
	) (ParticipantAccount, error)
	GetByPlatform(
		ctx context.Context,
		platformName string,
		platformId string) (ParticipantAccount, error)
	WithTx(tx SQLHandler) ParticipantAccountsRepo
}

type ParticipantAccount struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	PlatformName  string    `json:"platform_name"`
	PlatformId    string    `json:"platform_id"`
	DmChannelId   *string   `json:"dm_channel_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantAccountAddRequest struct {
	ParticipantId int     `json:"participant_id"`
	PlatformName  string  `json:"platform_name"`
	PlatformId    string  `json:"platform_id"`
	DmChannelId   *string `json:"dm_channel_id"`
	PlatformLogin string  `json:"platform_login"`
	IsFound       bool    `json:"is_found"`
}

type ParticipantAccountEditRequest struct {
	ParticipantId int     `json:"participant_id"`
	PlatformName  string  `json:"platform_name"`
	PlatformId    string  `json:"platform_id"`
	DmChannelId   *string `json:"dm_channel_id"`
	PlatformLogin string  `json:"platform_login"`
	IsFound       bool    `json:"is_found"`
}

type ParticipantAccoutnEditDMChannelRequest struct {
	ParticipantId int     `json:"participant_id"`
	PlatformName  string  `json:"platform_name"`
	DmChannelId   *string `json:"dm_channel_id"`
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
	PlatformName string `json:"platform_name"`
	PlatformId   string `json:"platform_id"`
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
	DmChannelId   *string   `json:"dm_channel_id"`
	PlatformLogin string    `json:"platform_login"`
	IsFound       bool      `json:"is_found"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ParticipantAccountGetRequestByLogin struct {
	PlatformName  string
	PlatformLogin string
}
