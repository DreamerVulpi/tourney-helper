package db

import (
	"context"
	"database/sql"
	"time"
)

// type Participant struct {
// 	GamerTag               string    `json:"gamerTag"`
// 	MessengerPlatform      string    `json:"messengerPlatform"`
// 	MessengerPlatformId    string    `json:"messengerPlatformId"`
// 	MessengerPlatformLogin string    `json:"messengerPlatformLogin"`
// 	UpdatedAt              time.Time `json:"updatedAt"`
// 	IsFound                bool      `json:"isFound"`
// 	Locale                 string    `json:"locale"`
// }

// type ParticipantAddRequest struct {
// 	GamerTag               string    `json:"gamerTag"`
// 	MessengerPlatform      string    `json:"messengerPlatform"`
// 	MessengerPlatformId    string    `json:"messengerPlatformId"`
// 	MessengerPlatformLogin string    `json:"messengerPlatformLogin"`
// 	UpdatedAt              time.Time `json:"updatedAt"`
// 	IsFound                bool      `json:"isFound"`
// 	Locale                 string    `json:"locale"`
// }

// type ParticipantEditRequest struct {
// 	GamerTag                string    `json:"gamerTag"`
// 	MessenagerPlatform      string    `json:"messenagerPlatform"`
// 	MessenagerPlatformId    string    `json:"messenagerPlatformId"`
// 	MessenagerPlatformLogin string    `json:"messenagerPlatformLogin"`
// 	UpdatedAt               time.Time `json:"updatedAt"`
// 	IsFound                 bool      `json:"isFound"`
// 	Locale                  string    `json:"locale"`
// }

// type ParticipantDeleteRequest struct {
// 	GamerTag           string `json:"gamerTag"`
// 	MessenagerPlatform string `json:"messenagerPlatform"`
// }

// type ParticipantGetRequest struct {
// 	GamerTag           string `json:"gamerTag"`
// 	MessenagerPlatform string `json:"messenagerPlatform"`
// }

// type ParticipantAddResponse struct {
// 	GamerTag          string `json:"gamerTag"`
// 	MessengerPlatform string `json:"messengerPlatform"`
// }

// type ParticipantEditResponse struct{}
// type ParticipantDeleteResponse struct{}
// type ParticipantGetResponse struct {
// 	GamerTag               string    `json:"gamerTag"`
// 	MessengerPlatform      string    `json:"messengerPlatform"`
// 	MessengerPlatformId    string    `json:"messengerPlatformId"`
// 	MessengerPlatformLogin string    `json:"messengerPlatformLogin"`
// 	UpdatedAt              time.Time `json:"updatedAt"`
// 	IsFound                bool      `json:"isFound"`
// 	Locale                 string    `json:"locale"`
// }

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
