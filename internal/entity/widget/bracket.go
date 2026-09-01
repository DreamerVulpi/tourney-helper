package widget

type Slot struct {
	Prefix       string
	GameNickname string
	Score        int
}

type Set struct {
	State         int
	Stream        string
	FullRountText string
	Round         int
	Slots         []Slot
}

type Bracket struct {
	Id   int64
	Sets []Set
}
