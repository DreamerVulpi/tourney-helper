package application

import (
	"fmt"
	"net/http"
	"sort"

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

func (a *App) GetListThemes() ([]string, error) {
	themes, err := a.ThemeProvider.ListThemes()
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return nil, err
	}

	sort.Strings(themes)

	logger.Log(entityLogger.Debug, fmt.Sprintf(
		"GetListThemes: found %d themes from %s",
		len(themes),
		a.ThemeProvider.ExternalDir(),
	))

	return themes, nil
}

func (a *App) LaunchWidgetBracket(
	tournamentPlatform string,
	cfgAuthorizations config.AuthorizationsCfg,
	cfgWidgets config.WidgetsCfg,
) error {
	a.mu.Lock()
	if a.wCancel != nil {
		a.mu.Unlock()
		err := fmt.Errorf("Widget bracket is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.mu.Unlock()

	// ========================================================
	// 1. Проверка URL виджета
	// ========================================================
	if len(cfgWidgets.Bracket.UrlToTournament) == 0 {
		err := fmt.Errorf("No tournament url/slug for get data tournament\n")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	// ========================================================
	// 2. Авторизация турнирной платформы + выбор провайдера
	// ========================================================
	var (
		provider service.BracketProvider
		renderer renderer.BracketRenderer
	)

	var tourneyCred config.ClientCredentials
	var tourneySlotIndex int

	switch tournamentPlatform {
	case "startgg":
		cred, idx, ok := cfgAuthorizations.Startgg.GetActiveSlotWithIndex()
		if !ok {
			err := fmt.Errorf("no active client slot for startgg")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		tourneyCred, tourneySlotIndex = cred, idx

		if tourneyCred.ClientID == "" {
			err := fmt.Errorf("no clientID in startgg slot #%d", tourneySlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if tourneyCred.SecretClient == "" {
			err := fmt.Errorf("no secretClient in startgg slot #%d", tourneySlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}

		if err := a.AuthorizeStartgg(tourneyCred.ClientID, tourneyCred.SecretClient, tourneySlotIndex); err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		logger.Log(entityLogger.Success, fmt.Sprintf("Start.gg slot #%d authorized", tourneySlotIndex+1))

		if err := a.AuthorizeStartgg(cred.ClientID, cred.SecretClient, tourneySlotIndex); err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		logger.Log(entityLogger.Success,
			fmt.Sprintf("The client (%v) has been successfully read",
				a.TournamentClient.NamePlatform))

		client := startgg.NewClient(a.TournamentClient.HTTPClient)
		provider = startggProvider.NewStartGGBracketProvider(client)
		renderer = startggRenderer.NewStartGGRendererWithThemeProvider(a.ThemeProvider)

	default:
		err := fmt.Errorf("Unsupported tournament platform: %s", tournamentPlatform)
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	// ========================================================
	// 3. Проверка BracketId
	// ========================================================
	if cfgWidgets.Bracket.BracketId == "" {
		err := fmt.Errorf("No bracket ID for widget — enter a valid tournament URL")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	logger.Log(entityLogger.Info,
		fmt.Sprintf("Widget will open bracket ID: %s", cfgWidgets.Bracket.BracketId))

	// ========================================================
	// 4. Запуск сервера
	// ========================================================
	_, cancel := context.WithCancel(context.Background())
	a.mu.Lock()
	a.RenderBracket = renderer
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
