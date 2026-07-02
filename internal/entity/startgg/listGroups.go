package startgg

type RawPhaseGroupsData struct {
	Data   DataEvent `json:"data"`
	Errors []Errors  `json:"errors"`
}

type DataEvent struct {
	Event Event `json:"event"`
}

type Event struct {
	Id          int64            `json:"id"`
	Name        string           `json:"name"`
	State       StateEvent       `json:"state"`
	PhaseGroups []PhaseGroupInfo `json:"phaseGroups"`
}

type SetsPageInfo struct {
	PageInfo PageInfo `json:"pageInfo"`
}

type PhaseGroupInfo struct {
	Id   int64        `json:"id"`
	Sets SetsPageInfo `json:"sets"`
}
