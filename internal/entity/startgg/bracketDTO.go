package startgg

import "encoding/json"

type WidgetPhaseGroupSetsResponse struct {
	Data   WidgetPhaseGroupData `json:"data"`
	Errors []Errors             `json:"errors"`
}

type WidgetPhaseGroupData struct {
	PhaseGroup WidgetPhaseGroup `json:"phaseGroup"`
}

type WidgetPhaseGroup struct {
	Id   int64          `json:"id"`
	Sets WidgetSetsPage `json:"sets"`
}

type WidgetSetsPage struct {
	PageInfo PageInfo        `json:"pageInfo"`
	Nodes    []WidgetSetNode `json:"nodes"`
}

type WidgetSetNode struct {
	Id             json.RawMessage      `json:"id"`
	State          State                `json:"state"`
	Stream         Streamer             `json:"stream"`
	FullRoundText  string               `json:"fullRoundText"`
	Round          int                  `json:"round"`
	WinnerId       int64                `json:"winnerId"`
	Slots          []WidgetSlot         `json:"slots"`
	Entrant1Source *WidgetEntrantSource `json:"entrant1Source"`
	Entrant2Source *WidgetEntrantSource `json:"entrant2Source"`
}

type WidgetSlot struct {
	Id       int64          `json:"id"`
	Entrant  *WidgetEntrant `json:"entrant"`
	Standing *Standing      `json:"standing"`
}

type WidgetEntrant struct {
	Id           int64               `json:"id"`
	Participants []WidgetParticipant `json:"participants"`
}

type WidgetParticipant struct {
	GamerTag string `json:"gamerTag"`
	Prefix   string `json:"prefix"`
}

type WidgetEntrantSource struct {
	Type      string          `json:"type"`
	TypeID    json.RawMessage `json:"typeId"`
	Condition string          `json:"condition"`
}
