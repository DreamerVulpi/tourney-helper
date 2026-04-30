package sender

import (
	"context"
)

type Participant struct {
	MessenagerID           string
	MessenagerLogin        string
	MessenagerName         string
	TournamentPlatformName string
	TournamentPlatformID   string
	GameName               string
	GameNickname           string
	GameID                 string
	Locale                 string
	IsFound                bool
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
