package db

import (
	"context"
	"time"
)

type ParticipantStatsRepo interface {
	Add(
		ctx context.Context,
		participantId int,
		gameName string,
		gameId string,
		rating int,
	) (int, error)
	Edit(
		ctx context.Context,
		participantId int,
		gameName string,
		gameId string,
		rating int,
	) error
	EditRating(
		ctx context.Context,
		participantId int,
		rating int,
	) error
	DelByGame(
		ctx context.Context,
		participantId int,
		gameName string,
	) error
	GetById(
		ctx context.Context,
		participantId int,
	) ([]ParticipantStat, error)
	GetByGame(
		ctx context.Context,
		participantId int,
		gameName string,
	) (ParticipantStat, error)
	WithTx(tx SQLHandler) ParticipantStatsRepo
}

type ParticipantStat struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participant_id"`
	GameName      string    `json:"gameName"`
	GameId        string    `json:"gameId"`
	Rating        int       `json:"rating"`
	UpdatedAt     time.Time `json:"updateAt"`
}

type ParticipantStatAddRequest struct {
	ParticipantId int    `json:"participant_id"`
	GameName      string `json:"gameName"`
	GameId        string `json:"gameId"`
	Rating        int    `json:"rating"`
}

type ParticipantStatEditRequest struct {
	ParticipantId int    `json:"participant_id"`
	GameName      string `json:"gameName"`
	GameId        string `json:"gameId"`
	Rating        int    `json:"rating"`
}

type ParticipantStatEditRatingRequest struct {
	Id     int `json:"id"`
	Rating int `json:"rating"`
}

type ParticipantStatDeleteRequestById struct {
	Id int `json:"id"`
}

type ParticipantStatDeleteRequestByGame struct {
	ParticipantId int    `json:"id"`
	GameName      string `json:"gameName"`
}

type ParticipantStatsGetRequestById struct {
	ParticipantId int `json:"id"`
}

type ParticipantStatGetRequestByGame struct {
	ParticipantId int    `json:"id"`
	GameName      string `json:"gameName"`
}

type ParticipantStatAddResponse struct {
	Id int `json:"id"`
}

type ParticipantStatEditResponse struct{}

type ParticipantStatDeleteResponse struct{}

type ParticipantStatGetResponse struct {
	Id            int       `json:"id"`
	ParticipantId int       `json:"participantId"`
	GameName      string    `json:"gameName"`
	GameId        string    `json:"gameId"`
	Rating        int       `json:"rating"`
	UpdatedAt     time.Time `json:"updateAt"`
}
