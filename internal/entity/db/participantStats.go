package db

type ParticipantStats struct {
	Id            int    `json:"id"`
	ParticipantId int    `json:"participant_id"`
	GameName      string `json:"gameName"`
	GameId        string `json:"gameId"`
	Rating        int    `json:"rating"`
}

type ParticipantStatsAddRequest struct {
	ParticipantId int    `json:"participant_id"`
	GameName      string `json:"gameName"`
	GameId        string `json:"gameId"`
	Rating        int    `json:"rating"`
}

type ParticipantStatsEditRequest struct {
	Id            int    `json:"id"`
	ParticipantId int    `json:"participant_id"`
	GameName      string `json:"gameName"`
	GameId        string `json:"gameId"`
	Rating        int    `json:"rating"`
}

type ParticipantStatsDeleteRequest struct {
	Id int `json:"id"`
}

type ParticipantStatsGetRequestById struct {
	ParticipantId int `json:"id"`
}

type ParticipantStatsGetRequestByGame struct {
	ParticipantId int    `json:"id"`
	GameName      string `json:"gameName"`
}

type ParticipantStatsAddResponse struct {
	Id int `json:"id"`
}

type ParticipantStatsEditResponse struct{}

type ParticipantStatsDeleteResponse struct{}

type ParticipantStatsGetResponse struct {
	Id            int    `json:"id"`
	ParticipantId int    `json:"participantId"`
	GameName      string `json:"gameName"`
	GameId        string `json:"gameId"`
	Rating        int    `json:"rating"`
}
