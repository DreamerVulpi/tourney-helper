package sender

import (
	"context"

	"github.com/dreamervulpi/tourneyBot/internal/auth"
)

type Participant struct {
	MessenagerID    string
	MessenagerLogin string
	MessenagerName  string
	GameNickname    string
	GameID          string
	Locales         []string
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
	GetMe(tourneyAuth *auth.AuthClient) (auth.Identity, error)
}
