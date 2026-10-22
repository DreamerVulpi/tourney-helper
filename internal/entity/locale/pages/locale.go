package pages

type Pages struct {
	Success          Page
	ErrorCantAuth    Page
	ErrorDontGetCode Page
	ErrorNoPage      Page
	AutoClose        AutoClose
}

type AutoClose struct {
	Title        string
	TimeUnit     string
	FallbackHint string
	ButtonLabel  string
}

type Page struct {
	Title   string
	Heading string
	Message string
}
