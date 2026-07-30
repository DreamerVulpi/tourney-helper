package auth

import (
	"context"
	"os"

	"github.com/bwmarrin/discordgo"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/challonge"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

func GetSessionDiscord() (*discordgo.Session, error) {
	ctx := context.Background()
	dsAuth := &AuthClient{
		Config:    GetDiscordOauth2(os.Getenv("DISCORD_CLIENT_ID"), os.Getenv("DISCORD_CLIENT_SECRET")),
		TokenFile: "token_discord.json",
	}
	if err := dsAuth.Init(ctx); err != nil {
		return nil, err
	}

	token, err := GetTokenFromFile(dsAuth.TokenFile)
	if err != nil {
		return nil, err
	}
	session, err := discordgo.New("Bot " + token.AccessToken)
	if err != nil {
		return nil, err
	}
	return session, nil
}
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

	token, err := GetTokenFromFile(chAuth.TokenFile)
	if err != nil {
		return nil, err
	}
	return challonge.NewClient(chAuth.HTTPClient, token.AccessToken), nil
}
