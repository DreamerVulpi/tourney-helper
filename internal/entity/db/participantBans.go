package db

import (
	"context"
	"time"

	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

type ParticipantBansRepo interface {
	Add(
		ctx context.Context,
		participantId int,
		typeBan string,
		reason string,
		expiresAt *time.Time) (int, error)
	Edit(
		ctx context.Context,
		participantId int,
		typeBan string,
		reason string,
		expiresAt *time.Time) error
	Delete(
		ctx context.Context,
		participantId int) error
	DeleteExpired(
		ctx context.Context) error
	Get(
		ctx context.Context,
		participantId int) (ParticipantBans, error)
	GetList(
		ctx context.Context,
		nameGame string, offset, limit int, search string,
	) ([]entitySender.Participant, error)
	IsBanned(
		ctx context.Context,
		id int) (bool, error)
	TotalCount(
		ctx context.Context,
	) (int, error)
	WithTx(tx SQLHandler) ParticipantBansRepo
}

type ParticipantBans struct {
	Id            int        `json:"id"`
	ParticipantId int        `json:"participant_id"`
	TypeBan       string     `json:"type_ban"`
	Reason        string     `json:"reason"`
	BannedAt      time.Time  `json:"banned_at"`
	ExpiresAt     *time.Time `json:"expires_at"`
}

type ParticipantBansAddRequest struct {
	ParticipantId int        `json:"participant_id"`
	TypeBan       string     `json:"type_ban"`
	Reason        string     `json:"reason"`
	ExpiresAt     *time.Time `json:"expires_at"`
}

type ParticipantBansEditRequest struct {
	ParticipantId int        `json:"participant_id"`
	TypeBan       string     `json:"type_ban"`
	Reason        string     `json:"reason"`
	ExpiresAt     *time.Time `json:"expires_at"`
}

type ParticipantBansDeleteRequest struct {
	ParticipantId int `json:"id"`
}

type ParticipantBansGetRequest struct {
	ParticipantId int `json:"participant_id"`
}

type ParticipantBansGetListRequest struct {
	GameName string `json:"gameName"`
	Limit    int    `json:"limit"`
	Offset   int    `json:"offset"`
	Search   string `json:"search"`
}

type ParticipantGetListResponse struct {
	ListBanned []entitySender.Participant `json:"list"`
	TotalCount int                        `json:"totalCount"`
}

type ParticipantIsBannedRequest struct {
	ParticipantId int `json:"participant_id"`
}

type ParticipantBansAddResponse struct {
	Id int `json:"id"`
}

type ParticipantBansEditResponse struct{}

type ParticipantBansDeleteResponse struct{}

type ParticipantBansGetResponse struct {
	Id            int        `json:"id"`
	ParticipantId int        `json:"participant_id"`
	TypeBan       string     `json:"type_ban"`
	Reason        string     `json:"reason"`
	BannedAt      time.Time  `json:"banned_at"`
	ExpiresAt     *time.Time `json:"expires_at"`
}

type ParticipantIsBannedResponse struct {
	IsBanned bool `json:"is_banned"`
}
