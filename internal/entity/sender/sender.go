package sender

import (
	"context"
	"time"
)

const NotificationDelay = 1000 * time.Millisecond

type Participant struct {
	Id                      int        `json:"id"`
	MessengerID             string     `json:"messengerId"`
	MessengerLogin          string     `json:"messengerLogin"`
	MessengerName           string     `json:"messengerName"`
	TournamentPlatformName  string     `json:"tournamentPlatformName"`
	TournamentPlatformLogin string     `json:"tournamentPlatformLogin"`
	TournamentPlatformID    string     `json:"tournamentPlatformId"`
	GameName                string     `json:"gameName"`
	GameNickname            string     `json:"gameNickname"`
	DmChannelId             *string    `json:"dmChannelId"`
	GameID                  string     `json:"gameId"`
	Region                  string     `json:"region"`
	Locale                  string     `json:"locale"`
	Rating                  int        `json:"rating"`
	IsFound                 bool       `json:"isFound"`
	IsBanned                string     `json:"isBanned"`
	UpdatedAt               time.Time  `json:"updatedAt"`
	TypeBan                 string     `json:"typeBan"`
	Reason                  string     `json:"reason"`
	BannedAt                *time.Time `json:"bannedAt"`
	ExpiresAt               *time.Time `json:"expiresAt"`
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
	State          int
}

type NotificationSender interface {
	FindContactOfParticipant(ctx context.Context, participant Participant) (Participant, error)
	SendMessage(ctx context.Context, targetID string, dmChannelID *string, data SetData) (string, error)
	GetPlatformMessengerName() string
	CreateDMChannel(ctx context.Context, platformID string) (*string, error)
}

type NotificationData interface {
	GetSetsData(ctx context.Context, slug string) ([]SetData, error)
	GetPlatformTournamentName() string
	GetTournamentSlug() (string, error)
}
