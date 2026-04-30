package sender

import (
	"github.com/dreamervulpi/tourneyBot/internal/infrastructure/startgg"
)

type StartggFinalConfig struct {
	FinalBracketId int64
	MinRoundNumA   int
	MinRoundNumB   int
	MaxRoundNumA   int
	MaxRoundNumB   int
}

type StartggSetAdapter struct {
	Client     *startgg.Client
	UrlToEvent string
	Slug       string
	Game       string
	Finals     StartggFinalConfig
	DebugMode  bool
	TestUser   Participant
	Contacts   map[string]Participant
}
