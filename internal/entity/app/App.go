package app

type ValidationResult struct {
	Valid    bool   `json:"valid"`
	Platform string `json:"platform"`
}
