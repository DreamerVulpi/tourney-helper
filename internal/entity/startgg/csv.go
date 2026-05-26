package startgg

type ImportedParticipantContact struct {
	Nickname                string `json:"nickname"`
	GameId                  string `json:"gameId"`
	GameName                string `json:"gameName"`
	Region                  string `json:"region"`
	Locale                  string `json:"locale"`
	Rating                  int    `json:"rating"`
	MessengerName           string `json:"messengerName"`
	MessengerID             string `json:"messengerId"`
	MessengerLogin          string `json:"messengerLogin"`
	TournamentPlatformName  string `json:"tournamentPlatformName"`
	TournamentPlatformLogin string `json:"tournamentPlatformLogin"`
	TournamentPlatformId    string `json:"tournamentPlatformId"`
	Discriminator           string `json:"discriminator"`
}
