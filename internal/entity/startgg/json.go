package startgg

type ParticipantImportContact struct {
	MessenagerLogin string `json:"messenagerLogin"`
	MessenagerName  string `json:"messenagerName"`
	GameName        string `json:"gameName"`
	GameNickname    string `json:"gameNickname"`
	GameID          string `json:"gameId"`
	Locale          string `json:"locale"`
}
