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
	bracket, err := s.provider.GetBracket(ctx, id)
	if err != nil {
		return "", fmt.Errorf("get bracket: %w", err)
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

func (s *BracketService) ListThemes() ([]string, error) {
	if ta, ok := s.renderer.(renderer.ThemeAware); ok {
		return ta.ListThemes()
	}
	return nil, nil
}
