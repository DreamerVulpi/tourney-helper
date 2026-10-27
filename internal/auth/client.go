package auth

import (
	"context"

	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/challonge"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

func GetClientStartgg(stAuth *AuthClient, collector *metrics.Collector) (*startgg.Client, error) {
	ctx := context.Background()
	if err := stAuth.Init(ctx); err != nil {
		return nil, err
	}

	client := startgg.NewClient(stAuth.HTTPClient)
	client.Metrics = collector
	return client, nil
}

func GetClientChallonge(chAuth *AuthClient) (*challonge.Client, error) {
	ctx := context.Background()
	if err := chAuth.Init(ctx); err != nil {
		return nil, err
	}

	return challonge.NewClient(chAuth.HTTPClient, chAuth.Token.AccessToken), nil
}
