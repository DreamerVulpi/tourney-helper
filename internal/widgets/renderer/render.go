package renderer

import (
	"strings"
	"unicode"

	"github.com/dreamervulpi/tourney-helper/config"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widgets"
)

type BracketRenderer interface {
	Render(bracket *entity.Bracket) (string, error)
	BuildView(bracket *entity.Bracket, themeName string) (*entity.BracketView, error)
}

type ThemeAware interface {
	RenderWithTheme(bracket *entity.Bracket, themeName string) (string, error)
	ListThemes() ([]string, error)
}

type ScoreboardRenderer interface {
	Render(scoreboard config.WidgetScoreboard) (string, error)
	RenderWithTheme(scoreboard config.WidgetScoreboard, themeName string) (string, error)
	ListThemes() ([]string, error)
	GetThemeCSS(name string) (string, error)
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
