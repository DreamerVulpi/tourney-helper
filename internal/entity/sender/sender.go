package sender

import (
	"context"
	"time"
)

type Participant struct {
	Id                      int       `json:"id"`
	MessenagerID            string    `json:"messenagerId"`
	MessenagerLogin         string    `json:"messenagerLogin"`
	MessenagerName          string    `json:"messenagerName"`
	TournamentPlatformName  string    `json:"tournamentPlatformName"`
	TournamentPlatformLogin string    `json:"tournamentPlatformLogin"`
	TournamentPlatformID    string    `json:"tournamentPlatformId"`
	GameName                string    `json:"gameName"`
	GameNickname            string    `json:"gameNickname"`
	GameID                  string    `json:"gameId"`
	Region                  string    `json:"region"`
	Locale                  string    `json:"locale"`
	Rating                  int       `json:"rating"`
	IsFound                 bool      `json:"isFound"`
	UpdatedAt               time.Time `json:"updatedAt"`
}

type SetData struct {
	TournamentName string
	SetID          int64
	StreamName     string
	StreamSourse   string
	RoundNum       int
	PhaseGroupId   int64
	ContactPlayer1 Participant
	ContactPlayer2 Participant
	FullInviteLink string
	IsFinals       bool
	IsTest         bool
}

type NotificationSender interface {
	FindContactOfParticipant(ctx context.Context, participant Participant) (Participant, error)
	SendNotification(ctx context.Context, targetID string, data SetData) error
	GetPlatformMessenagerName() string
}

type NotificationData interface {
	GetSetsData(ctx context.Context) ([]SetData, error)
	GetPlatformTournamentName() string
	GetTournamentSlug() (string, error)
}
