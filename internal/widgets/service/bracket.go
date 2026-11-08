package service

import (
	"context"
	"fmt"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widgets"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/renderer"
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

func (s *BracketService) RenderWithTheme(ctx context.Context, id string, theme string) (string, error) {
	return s.RenderWithMessages(ctx, id, theme, entity.BracketErrorMessages{})
}

// RenderWithMessages рендерит сетку, встраивая локализованные тексты ошибки.
func (s *BracketService) RenderWithMessages(
	ctx context.Context,
	id string,
	theme string,
	messages entity.BracketErrorMessages,
) (string, error) {
	bracket, err := s.provider.GetBracket(ctx, id)
	if err != nil {
		return "", fmt.Errorf("get bracket: %w", err)
	}

	if ea, ok := s.renderer.(renderer.ErrorAware); ok {
		html, err := ea.RenderWithErrorMessages(bracket, theme, messages)
		if err != nil {
			return "", fmt.Errorf("render bracket with theme %q: %w", theme, err)
		}
		return html, nil
	}

	if ta, ok := s.renderer.(renderer.ThemeAware); ok {
		html, err := ta.RenderWithTheme(bracket, theme)
		if err != nil {
			return "", fmt.Errorf("render bracket with theme %q: %w", theme, err)
		}
		return html, nil
	}

	html, err := s.renderer.Render(bracket)
	if err != nil {
		return "", fmt.Errorf("render bracket: %w", err)
	}

	return html, nil
}

// RenderError рендерит страницу с локализованной ошибкой внешнего сервиса.
func (s *BracketService) RenderError(
	theme string,
	messages entity.BracketErrorMessages,
) (string, error) {
	if ea, ok := s.renderer.(renderer.ErrorAware); ok {
		return ea.RenderError(theme, messages)
	}
	return "", fmt.Errorf("renderer does not support error rendering")
}

func (s *BracketService) ListThemes() ([]string, error) {
	if ta, ok := s.renderer.(renderer.ThemeAware); ok {
		return ta.ListThemes()
	}
	return nil, nil
}
