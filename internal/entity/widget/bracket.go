package widget

import "html/template"

type EntrantSource struct {
	Type      string
	TypeID    int64
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
	Id            int64
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
	Prefix   string
	Nickname string
	Score    int
}

type SetView struct {
	Id            int64
	State         int
	Stream        string
	Position      int
	Section       string // "winners", "losers", "final"
	Round         int    // for debug
	FullRoundText string
	Players       []PlayerView
}

type ConnectionView struct {
	FromSetID int64
	ToSetID   int64

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
