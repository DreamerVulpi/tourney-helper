package app

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
