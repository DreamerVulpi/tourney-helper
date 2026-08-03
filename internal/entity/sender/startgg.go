package sender

import (
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

type StartggClient interface {
	GetTournament(slug string) (entity.Tournament, error)
	GetListGroups(slug string, states []int) ([]entity.PhaseGroupInfo, error)
	GetSets(groupID int64, page, perPage int, states []int) ([]entity.Nodes, error)
}

type StartggFinalConfig struct {
	FinalBracketId int64
	MinRoundNumA   int
	MinRoundNumB   int
	MaxRoundNumA   int
	MaxRoundNumB   int
}

type StartggSetAdapter struct {
	Client StartggClient

	UrlToEvent    string
	MessengerName string
	DebugMode     bool
	Slug          string
	Game          string
	TestUser      Participant
	Contacts      map[string]Participant

	Finals StartggFinalConfig
}
