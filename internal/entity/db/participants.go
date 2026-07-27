package db

import (
	"context"
	"database/sql"
	"time"

	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
)

type SQLHandler interface {
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

type ParticipantRepo interface {
	Add(
		ctx context.Context,
		nickname string,
		region string,
		locale string) (int, error)
	Edit(
		ctx context.Context,
		id int,
		nickname string,
		region string,
		locale string) error
	Del(
		ctx context.Context,
		id int) error
	GetById(
		ctx context.Context,
		id int) (Participant, error)
	GetByNickname(
		ctx context.Context,
		nickname string) (Participant, error)
	GetList(ctx context.Context, nameMessengerPlatform, nameTournamentPlatform, nameGame string, offset, limit int, search string) ([]entitySender.Participant, error)
	GetListSortByRating(ctx context.Context, nameMessengerPlatform, nameTournamentPlatform, nameGame string, offset, limit int, search string) ([]entitySender.Participant, error)
	TotalCount(ctx context.Context, nameGame string) (int, error)
	TotalCountInRatingLeague(ctx context.Context, gameName string) (int, error)
	WithTx(tx SQLHandler) ParticipantRepo
}

type Participant struct {
	Id        int       `json:"id"`
	Nickname  string    `json:"nickname"`
	Region    string    `json:"region"`
	Locale    string    `json:"locale"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ParticipantAddRequest struct {
	Nickname string `json:"nickname"`
	Region   string `json:"region"`
	Locale   string `json:"locale"`
}

type ParticipantEditRequest struct {
	Id       int    `json:"id"`
	Nickname string `json:"nickname"`
	Region   string `json:"region"`
	Locale   string `json:"locale"`
}

type ParticipantDeleteRequest struct {
	Id int `json:"id"`
}

type ParticipantGetRequestById struct {
	Id int `json:"id"`
}

type ParticipantGetRequestByNickname struct {
	Nickname string `json:"nickname"`
}

type ParticipantGetTotalCountRequest struct {
	GameName string `json:"gameName"`
}

type ParticipantGetParticipantsListRequest struct {
	MessengerName          string `json:"messengerName"`
	TournamentPlatformName string `json:"tournamentPlatformName"`
	GameName               string `json:"gameName"`
	Limit                  int    `json:"limit"`
	Offset                 int    `json:"offset"`
	Search                 string `json:"search"`
}

type ParticipantGetParticipantsListResponse struct {
	ListParticipants []entitySender.Participant `json:"list"`
}

type ParticipantGetParticipantsListWithTotalCountResponse struct {
	Items      []entitySender.Participant `json:"items"`
	TotalCount int                        `json:"totalCount"`
}

type ParticipantGetTotalCountResponse struct {
	TotalCount int `json:"totalCount"`
}

type ParticipantAddResponse struct {
	Id int `json:"id"`
}

type ParticipantEditResponse struct{}

type ParticipantDeleteResponse struct{}

type ParticipantGetResponse struct {
	Id        int       `json:"id"`
	Nickname  string    `json:"nickname"`
	Region    string    `json:"region"`
	Locale    string    `json:"locale"`
	UpdatedAt time.Time `json:"updated_at"`
}
