package service

import (
	"context"
	"fmt"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
	"github.com/dreamervulpi/tourney-helper/internal/widget/renderer"
)

type BracketService struct {
	provider BracketProvider
	renderer renderer.BracketRenderer
}

func NewBracketService(provider BracketProvider, renderer renderer.BracketRenderer) *BracketService {
	return &BracketService{
		provider: provider,
		renderer: renderer,
	}
}

type BracketProvider interface {
	GetBracket(ctx context.Context, id string) (*entity.Bracket, error)
}

func (s *BracketService) Get(ctx context.Context, id string) (*entity.Bracket, error) {
	bracket, err := s.provider.GetBracket(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get bracket: %w", err)
	}

	return bracket, nil
}

// Render рендерит сетку с темой по умолчанию.
// Оставлен для обратной совместимости с интерфейсом BracketRenderer.
func (s *BracketService) Render(ctx context.Context, id string) (string, error) {
	return s.RenderWithTheme(ctx, id, "")
}

func (s *BracketService) GetBracketView(ctx context.Context, id string, theme string) (*entity.BracketView, error) {
	bracket, err := s.provider.GetBracket(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get bracket: %w", err)
	}

	view, err := s.renderer.BuildView(bracket, theme)
	if err != nil {
		return nil, fmt.Errorf("build view: %w", err)
	}

	return view, nil
}

// RenderWithTheme рендерит сетку с указанной темой.
// Если рендерер поддерживает ThemeAware — используется указанная тема.
// Иначе тема игнорируется и используется обычный Render.
func (s *BracketService) RenderWithTheme(ctx context.Context, id string, theme string) (string, error) {
	bracket, err := s.provider.GetBracket(ctx, id)
	if err != nil {
		return "", fmt.Errorf("get bracket: %w", err)
	}

	// Если рендерер поддерживает темы — используем RenderWithTheme
	if ta, ok := s.renderer.(renderer.ThemeAware); ok {
		html, err := ta.RenderWithTheme(bracket, theme)
		if err != nil {
			return "", fmt.Errorf("render bracket with theme %q: %w", theme, err)
		}
		return html, nil
	}

	// Иначе — обычный Render, тема игнорируется
	html, err := s.renderer.Render(bracket)
	if err != nil {
		return "", fmt.Errorf("render bracket: %w", err)
	}

	return html, nil
}

// ListThemes возвращает список доступных тем.
// Если рендерер не поддерживает темы — возвращает nil.
func (s *BracketService) ListThemes() ([]string, error) {
	if ta, ok := s.renderer.(renderer.ThemeAware); ok {
		return ta.ListThemes()
	}
	return nil, nil
}
