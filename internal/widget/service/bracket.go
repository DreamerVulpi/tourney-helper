package service

import (
	"context"
	"fmt"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
)

type BracketService struct {
	provider BracketProvider
}

func NewBracketService(provider BracketProvider) *BracketService {
	return &BracketService{
		provider: provider,
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
