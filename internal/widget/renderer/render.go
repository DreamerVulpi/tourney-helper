package renderer

import (
	"strings"
	"unicode"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
)

type BracketRenderer interface {
	Render(bracket *entity.Bracket) (string, error)
	BuildView(bracket *entity.Bracket, themeName string) (*entity.BracketView, error)
}

type ThemeAware interface {
	RenderWithTheme(bracket *entity.Bracket, themeName string) (string, error)
	ListThemes() ([]string, error)
}

func ClearString(s string) string {
	if s == "" {
		return ""
	}

	var b strings.Builder
	b.Grow(len(s))

	for _, r := range s {
		switch r {
		case '<', '>', '"', '\'', '&', '\\':
			continue
		}
		if unicode.IsControl(r) {
			continue
		}
		b.WriteRune(r)
	}
	result := strings.TrimSpace(b.String())
	return result
}
