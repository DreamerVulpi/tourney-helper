package renderer

import (
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
)

type BracketRenderer interface {
	Render(bracket *entity.Bracket) (string, error)
}

type ThemeAware interface {
	RenderWithTheme(bracket *entity.Bracket, themeName string) (string, error)
	ListThemes() ([]string, error)
}
