package validator

import (
	"fmt"
	"strings"
)

// Platform — интерфейс для валидатора URL конкретной платформы.
// Каждая платформа реализует этот интерфейс.
type Platform interface {
	Name() string

	// Match проверяет, относится ли URL к этой платформе.
	// Возвращает true, если URL похож на эту платформу (даже если он невалидный).
	// Возвращает false, если URL точно не относится к этой платформе.
	Match(url string) bool

	// Validate проверяет, что URL — валидная ссылка на турнирную сетку этой платформы.
	// Возвращает true только если URL полностью соответствует формату платформы.
	Validate(url string) bool
}

type Result struct {
	Valid    bool   `json:"valid"`
	Platform string `json:"platform"`
}

// Validator — оркестратор, который прогоняет URL через все платформы.
type Validator struct {
	platforms []Platform
}

// NewValidator создаёт валидатор со всеми зарегистрированными платформами.
func NewValidator() *Validator {
	return &Validator{
		platforms: []Platform{
			NewStartGGPlatform(),
			// NewChallongePlatform(),  // ← добавить позже
			// NewTonamelPlatform(),    // ← добавить позже
		},
	}
}

// ValidateURL проверяет URL и возвращает результат.
//
// Поведение:
//   - Пустой URL              → {Valid: false, Platform: ""}
//   - URL не подошёл ни одной → {Valid: false, Platform: "unknown"}
//   - URL подошёл, но битый   → {Valid: false, Platform: "<name>"}
//   - URL валидный            → {Valid: true,  Platform: "<name>"}
func (v *Validator) ValidateURL(rawURL string) Result {
	rawURL = strings.TrimSpace(rawURL)

	if rawURL == "" {
		return Result{Valid: false, Platform: ""}
	}

	for _, platform := range v.platforms {
		if !platform.Match(rawURL) {
			continue
		}

		// Платформа распознана — возвращаем её имя и результат Validate.
		return Result{
			Valid:    platform.Validate(rawURL),
			Platform: platform.Name(),
		}
	}

	// Ни одна платформа не подошла.
	return Result{Valid: false, Platform: "unknown"}
}

// IsValidURL — удобная обёртка, если нужен только bool.
func (v *Validator) IsValidURL(rawURL string) (bool, string) {
	r := v.ValidateURL(rawURL)
	return r.Valid, r.Platform
}

// String — для отладки.
func (r Result) String() string {
	return fmt.Sprintf("valid=%t platform=%q", r.Valid, r.Platform)
}
