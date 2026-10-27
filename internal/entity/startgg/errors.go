package startgg

type Errors struct {
	Message    string      `json:"message"`
	Path       []any       `json:"path"`
	Locations  []Locations `json:"locations"`
	Extensions Extensions  `json:"extensions"`
}

type Locations struct {
	Line   int `json:"line"`
	Column int `json:"column"`
}

type Extensions struct {
	Category string `json:"category"`
}

type FailedCall struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
