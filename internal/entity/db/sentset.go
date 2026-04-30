package db

import (
	"context"
	"time"
)

type SentSetRepo interface {
	Add(ctx context.Context, setId int64, tournamentPlatform string, messengerPlatform string, tournamentSlug string, sent_at_p1 *time.Time, sent_at_p2 *time.Time) (int64, error)
	Get(ctx context.Context, setId int64) (SentSet, error)
	Del(ctx context.Context, setId int64) error
	Edit(ctx context.Context, setId int64, tournamentPlatform string, messengerPlatform string, tournamentSlug string, sent_at_p1 *time.Time, sent_at_p2 *time.Time) error
	Exists(ctx context.Context, setId int64) (bool, error)
	WithTx(tx SQLHandler) SentSetRepo
}

type SentSet struct {
	SetId              int64      `json:"setId"`
	TournamentPlatform string     `json:"tournamentPlatform"`
	MessengerPlatform  string     `json:"messengerPlatform"`
	TournamentSlug     string     `json:"tournamentSlug"`
	SentAtP1           *time.Time `json:"sentAtP1"`
	SentAtP2           *time.Time `json:"sentAtP2"`
}

type SentSetCheckRequest struct {
	SetId int64 `json:"setId"`
}

type SentSetAddRequest struct {
	SetId              int64      `json:"setId"`
	TournamentPlatform string     `json:"sourcePlatform"`
	MessengerPlatform  string     `json:"messengerPlatform"`
	TournamentSlug     string     `json:"tournamentSlug"`
	SentAtP1           *time.Time `json:"sentAtP1"`
	SentAtP2           *time.Time `json:"sentAtP2"`
}

type SentSetEditRequest struct {
	SetId              int64      `json:"setId"`
	TournamentPlatform string     `json:"sourcePlatform"`
	MessengerPlatform  string     `json:"messengerPlatform"`
	TournamentSlug     string     `json:"tournamentSlug"`
	SentAtP1           *time.Time `json:"sentAtP1"`
	SentAtP2           *time.Time `json:"sentAtP2"`
}

type SentSetDeleteRequest struct {
	SetId int64 `json:"setId"`
}

type SentSetGetRequest struct {
	SetId int64 `json:"setId"`
}

type SentSetAddResponse struct {
	SetId int64 `json:"setId"`
}

type SentSetCheckResponse struct {
	State bool `json:"state"`
}

type SentSetEditResponse struct{}

type SentSetDeleteResponse struct{}

type SentSetGetResponse struct {
	SetId              int64      `json:"setId"`
	TournamentPlatform string     `json:"tournamentPlatform"`
	MessengerPlatform  string     `json:"messengerPlatform"`
	TournamentSlug     string     `json:"tournamentSlug"`
	SentAtP1           *time.Time `json:"sentAtP1"`
	SentAtP2           *time.Time `json:"sentAtP2"`
}
