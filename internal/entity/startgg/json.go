package startgg

type ParticipantImportContact struct {
	MessengerLogin string `json:"messengerLogin"`
	MessengerName  string `json:"messengerName"`
	GameName       string `json:"gameName"`
	GameNickname   string `json:"gameNickname"`
	GameID         string `json:"gameId"`
	Locale         string `json:"locale"`
}
