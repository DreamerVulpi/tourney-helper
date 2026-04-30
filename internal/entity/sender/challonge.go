package sender

import "github.com/dreamervulpi/tourneyBot/internal/infrastructure/challonge"

type ChallongeMatchAdapter struct {
	Client          *challonge.Client
	UrlToTournament string
	DebugMode       bool
	TestUser        Participant
}
