package widget

import "html/template"

type EntrantSource struct {
	Type      string
	TypeID    string
	Condition string
}

// ProgressionTarget describes where a participant advances after the set
// (for example, into a phase group of the next bracket).
type ProgressionTarget struct {
	Side              string `json:"side"` // "winner" or "loser"
	PhaseGroupID      int64  `json:"phaseGroupId"`
	PhaseName         string `json:"phaseName"`
	DisplayIdentifier string `json:"displayIdentifier"`
	Label             string `json:"label"`
}

type Slot struct {
	Id           int64
	Prefix       string
	GameNickname string
	Score        int

	Source *EntrantSource
}

type Set struct {
	Id            string
	State         int
	Stream        string
	FullRoundText string
	Round         int
	WinnerId      int64
	Position      int
	Slots         []Slot

	Progressions []ProgressionTarget
}

type Bracket struct {
	Id    int64
	Label string
	Sets  []Set
}

type PlayerView struct {
	Slot     int    `json:"slot"`
	Id       string `json:"id"`
	Prefix   string `json:"prefix"`
	Nickname string `json:"nickname"`
	Score    string `json:"score"`
}

type SetView struct {
	Id            string       `json:"id"`
	State         int          `json:"state"`
	Stream        string       `json:"stream"`
	Position      int          `json:"position"`
	Section       string       `json:"section"` // "winners", "losers", "final"
	Round         int          `json:"round"`   // for debug
	FullRoundText string       `json:"fullRoundText"`
	WinnerId      int64        `json:"winnerId"`
	Players       []PlayerView `json:"players"`

	NextBrackets []ProgressionTarget `json:"nextBrackets"`
}

type ConnectionView struct {
	FromSetID string `json:"fromSetID"`
	ToSetID   string `json:"toSetID"`

	FromSlot int `json:"fromSlot"`
	ToSlot   int `json:"toSlot"`

	Condition string `json:"condition"`
}

type BracketView struct {
	Id          int64            `json:"id"`
	Label       string           `json:"label"`
	Sets        []SetView        `json:"sets"`
	Connections []ConnectionView `json:"connections"`
	SystemCSS   template.CSS     `json:"systemCSS"`
	ThemeCSS    template.CSS     `json:"themeCSS"`

	HasError         bool   `json:"hasError"`
	ErrorTitle       string `json:"errorTitle"`
	ErrorDescription string `json:"errorDescription"`
	RetryLabel       string `json:"retryLabel"`
}

// BracketErrorMessages contains localized texts for the widget error overlay.
type BracketErrorMessages struct {
	Title       string
	Description string
	RetryLabel  string
}
