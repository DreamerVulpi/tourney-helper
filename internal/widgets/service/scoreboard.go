package service

import (
	"fmt"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/renderer"
)

type ScoreboardService struct {
	renderer renderer.ScoreboardRenderer
}

func NewScoreboardService(r renderer.ScoreboardRenderer) *ScoreboardService {
	return &ScoreboardService{renderer: r}
}

func (s *ScoreboardService) RenderWithTheme(state config.WidgetScoreboard, theme string) (string, error) {
	html, err := s.renderer.RenderWithTheme(state, theme)
	if err != nil {
		return "", fmt.Errorf("render scoreboard with theme %q: %w", theme, err)
	}
	return html, nil
}

func (s *ScoreboardService) Render(state config.WidgetScoreboard) (string, error) {
	return s.RenderWithTheme(state, "")
}

func (s *ScoreboardService) ListThemes() ([]string, error) {
	return s.renderer.ListThemes()
}

func (s *ScoreboardService) GetThemeCSS(name string) (string, error) {
	return s.renderer.GetThemeCSS(name)
}
