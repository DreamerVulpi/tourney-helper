package application

import (
	"fmt"
	"net/http"

	"context"

	"errors"

	"time"

	"github.com/dreamervulpi/tourney-helper/config"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	startggProvider "github.com/dreamervulpi/tourney-helper/internal/widget/provider/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/widget/renderer"
	startggRenderer "github.com/dreamervulpi/tourney-helper/internal/widget/renderer/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/widget/service"
)

func (a *App) LaunchWidgetBracket(tournamentPlatform string, cfgTournament config.ConfigTournament) error {
	a.mu.Lock()
	if a.wCancel != nil {
		a.mu.Unlock()
		err := fmt.Errorf("Widget bracket is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.mu.Unlock()

	if len(cfgTournament.WidgetBracket.UrlToTournament) == 0 {
		err := fmt.Errorf("No tournament url/slug for get data tournament\n")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	var (
		provider service.BracketProvider
		renderer renderer.BracketRenderer
	)

	switch tournamentPlatform {
	case "startgg":
		if len(cfgTournament.Startgg.ClientID) == 0 {
			err := fmt.Errorf("No clientID for authorization\n")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if len(cfgTournament.Startgg.SecretClient) == 0 {
			err := fmt.Errorf("No secretClient for bot authorization\n")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		err := a.AuthorizeStartgg(cfgTournament.Startgg.ClientID, cfgTournament.Startgg.SecretClient)
		if err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		logger.Log(entityLogger.Success, fmt.Sprintf("The client (%v) has been successfully readed", a.TournamentClient.NamePlatform))

		client := startgg.NewClient(a.TournamentClient.HTTPClient)
		provider = startggProvider.NewStartGGBracketProvider(client)
		renderer = startggRenderer.NewStartGGRenderer()
	}

	// slug, err := a.ParseTournamentURL(tournamentPlatform, cfgTournament.WidgetBracket.UrlToTournament)
	// if err != nil {
	// 	logger.Log(entityLogger.Error, err.Error())
	// 	return err
	// }
	// cfgTournament.WidgetBracket.UrlToTournament = slug
	// if a.ConfigTournament != nil {
	// 	a.ConfigTournament.WidgetBracket.UrlToTournament = slug
	// }

	_, cancel := context.WithCancel(context.Background())
	a.mu.Lock()
	a.wCancel = cancel
	a.mu.Unlock()

	bracketService := service.NewBracketService(provider, renderer)
	a.WidgetServer.SetBracketService(bracketService)

	go func() {
		logger.Log(entityLogger.Info, "Widget server starting on :8080")

		err := a.WidgetServer.Start(":8080")
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Log(entityLogger.Error, fmt.Sprintf("Widget server: %v", err))
		}

	}()

	return nil
}

func (a *App) StopWidgetBracket() {
	a.mu.Lock()
	cancel := a.wCancel
	a.wCancel = nil
	a.mu.Unlock()

	if cancel != nil {
		cancel()
	}

	ctx, cancelShutdown := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancelShutdown()

	if err := a.WidgetServer.Stop(ctx); err != nil {
		logger.Log(entityLogger.Error, err.Error())
	}
}
