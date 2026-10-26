package widget

import "html/template"

type EntrantSource struct {
	Type      string
	TypeID    string
	Condition string
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
}

type Bracket struct {
	Id   int64
	Sets []Set
}

type PlayerView struct {
	Slot     int
	Id       string
	Prefix   string
	Nickname string
	Score    string
}

type SetView struct {
	Id            string
	State         int
	Stream        string
	Position      int
	Section       string // "winners", "losers", "final"
	Round         int    // for debug
	FullRoundText string
	WinnerId      int64
	Players       []PlayerView
}

type ConnectionView struct {
	FromSetID string
	ToSetID   string

	FromSlot int
	ToSlot   int

	Condition string
}

type BracketView struct {
	Id          int64
	Sets        []SetView
	Connections []ConnectionView
	SystemCSS   template.CSS
	ThemeCSS    template.CSS
}
