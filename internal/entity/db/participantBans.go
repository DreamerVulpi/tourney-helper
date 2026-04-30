package db

import (
	"context"
	"time"
)

type ParticipantBansRepo interface {
	Add(
		ctx context.Context,
		participantId int,
		typeBan string,
		reason string,
		bannedAt time.Time,
		expiresAt *time.Time) (int, error)
	Edit(
		ctx context.Context,
		id int,
		participantId int,
		typeBan string,
		reason string,
		bannedAt time.Time,
		expiresAt *time.Time) error
	Delete(
		ctx context.Context,
		participantId int) error
	Get(
		ctx context.Context,
		participantId int) (ParticipantBans, error)
	IsBanned(
		ctx context.Context,
		id int) (bool, error)
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
	BannedAt      time.Time  `json:"banned_at"`
	ExpiresAt     *time.Time `json:"expires_at"`
}

type ParticipantBansEditRequest struct {
	Id            int        `json:"id"`
	ParticipantId int        `json:"participant_id"`
	TypeBan       string     `json:"type_ban"`
	Reason        string     `json:"reason"`
	BannedAt      time.Time  `json:"banned_at"`
	ExpiresAt     *time.Time `json:"expires_at"`
}

type ParticipantBansDeleteRequest struct {
	ParticipantId int `json:"id"`
}

type ParticipantBansGetRequest struct {
	ParticipantId int `json:"participant_id"`
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
