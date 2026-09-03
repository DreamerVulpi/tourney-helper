package startgg

// State (1 - IsNotStarted, 2 - InProcess, 3 - IsDone)
type State int

const (
	IsNotStarted State = 1
	InProcess    State = 2
	IsDone       State = 3
)

// State for event (1 - Created, 2 - Active, 3 - Completed)
type StateEvent string

const (
	Created   StateEvent = "CREATED"
	Active    StateEvent = "ACTIVE"
	Completed StateEvent = "COMPLETED"
)

type RawPhaseGroupSetsData struct {
	Data   DataPhaseGroupSets `json:"data"`
	Errors []Errors           `json:"errors"`
}

type DataPhaseGroupSets struct {
	PhaseGroup PhaseGroupSets `json:"phaseGroup"`
}

// Group(Phase)
type PhaseGroupSets struct {
	Id   int64 `json:"id"`
	Sets Sets  `json:"sets"`
}

type Sets struct {
	PageInfo PageInfo `json:"pageInfo"`
	Nodes    []Nodes  `json:"nodes"`
}

// Sets counts in Group(Phase)
type PageInfo struct {
	Total int `json:"total"`
}

type EntrantSource struct {
	Type      string `json:"type"`
	TypeID    int64  `json:"typeId"`
	Condition string `json:"condition"`
}

// Information about Set
type Nodes struct {
	Id             int64          `json:"id"`
	State          State          `json:"state"`
	FullRoundText  string         `json:"fullRoundText"`
	Round          int            `json:"round"`
	WinnerId       int64          `json:"winnerId"`
	Stream         Streamer       `json:"stream"`
	Slots          []Slot         `json:"slots"`
	Entrant1Source *EntrantSource `json:"entrant1Source"`
	Entrant2Source *EntrantSource `json:"entrant2Source"`
}

type Streamer struct {
	StreamName   string `json:"streamName"`
	StreamSource string `json:"streamSource"`
}

type Standing struct {
	Stats Stats `json:"stats"`
}

type Stats struct {
	Score Score `json:"score"`
}

type Score struct {
	Value int `json:"value"`
}

// Slot in set
type Slot struct {
	Entrant  Entrant  `json:"entrant"`
	Standing Standing `json:"standing"`
}

// Player in tournament
type Entrant struct {
	Id           int64         `json:"id"`
	Participants []Participant `json:"participants"`
}

// Player data
type Participant struct {
	Prefix            string            `json:"prefix"`
	GamerTag          string            `json:"gamerTag"`
	ConnectedAccounts ConnectedAccounts `json:"connectedAccounts"`
	User              User              `json:"user"`
}

// Linked accounts
type ConnectedAccounts struct {
	Tekken Tekken `json:"tekken"`
	SF6    SF6    `json:"capcom"`
}

type Tekken struct {
	TekkenID string `json:"value"`
}

type SF6 struct {
	GameID string `json:"value"`
}

// User authorizations (Discord and etc.)
type User struct {
	ID             int64            `json:"id"`
	Slug           string           `json:"slug"`
	Authorizations []Authorizations `json:"authorizations"`
}

type Authorizations struct {
	Discord string `json:"externalUsername"`
}
