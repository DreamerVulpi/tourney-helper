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
	bracket, err := s.provider.GetBracket(ctx, id)
	if err != nil {
		return "", fmt.Errorf("get bracket: %w", err)
	}

	html, err := s.renderer.Render(bracket)
	if err != nil {
		return "", fmt.Errorf("render bracket: %w", err)
	}

	return html, nil
}
