package startgg

type RawUserData struct {
	Data   UserData `json:"data"`
	Errors []Errors `json:"errors"`
}

type UserData struct {
	User UserProfile `json:"user"`
}

type UserProfile struct {
	ID             int64            `json:"id"`
	Slug           string           `json:"slug"`
	Authorizations []Authorizations `json:"authorizations"`
	Player         Player           `json:"player"`
}

type Player struct {
	ID       int64  `json:"id"`
	GamerTag string `json:"gamerTag"`
}
