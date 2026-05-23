package app

type EditParticipantRequest struct {
	Id                      int         `json:"id"`
	Nickname                string      `json:"nickname"`
	GameId                  string      `json:"gameId"`
	GameName                string      `json:"gameName"`
	Region                  string      `json:"region"`
	Locale                  string      `json:"locale"`
	Rating                  int         `json:"rating"`
	MessengerName           string      `json:"messengerName"`
	MessengerLogin          string      `json:"messengerLogin"`
	TournamentPlatformName  string      `json:"tournamentPlatformName"`
	TournamentPlatformLogin string      `json:"tournamentPlatformLogin"`
	BanInfo                 *BanRequest `json:"banInfo"`
}

type BanRequest struct {
	Id          int    `json:"id"`
	TypeBan     string `json:"typeBan"`
	Reason      string `json:"reason"`
	Duration    int    `json:"duration"`
	Unit        string `json:"unit"` // min., h., d., mon.
	IsPermanent bool   `json:"isPermanent"`
}

type UnbanRequest struct {
	ParticipantId int `json:"participantId"`
}

type DeleteParticipantRequest struct {
	ParticipantId int `json:"participantId"`
}
