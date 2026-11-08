package application

import (
	"fmt"
	"sort"

	"github.com/dreamervulpi/tourney-helper/config"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	startggProvider "github.com/dreamervulpi/tourney-helper/internal/widgets/provider/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/renderer"
	startggRenderer "github.com/dreamervulpi/tourney-helper/internal/widgets/renderer/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/service"
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
	slotIndex int,
	cfgAuthorizations config.AuthorizationsCfg,
	cfgWidgets config.WidgetsCfg,
) error {
	a.mu.Lock()
	if a.bracketRunning {
		a.mu.Unlock()
		err := fmt.Errorf("Widget bracket is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.mu.Unlock()

	if len(cfgWidgets.Bracket.UrlToTournament) == 0 {
		err := fmt.Errorf("No tournament url/slug for get data tournament\n")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	var (
		provider service.BracketProvider
		renderer renderer.BracketRenderer
	)

	var tourneyCred config.ClientCredentials
	var tourneySlotIndex int

	switch tournamentPlatform {
	case "startgg":
		slot, ok := cfgAuthorizations.Startgg.GetSlotByIndex(slotIndex)
		if !ok {
			err := fmt.Errorf("no slot with index=%d for startgg", slotIndex)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		tourneyCred, tourneySlotIndex = slot, slotIndex

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

		client := startgg.NewClient(a.TournamentClient.HTTPClient)
		provider = startggProvider.NewStartGGBracketProvider(client)
		renderer = startggRenderer.NewStartGGRendererWithThemeProvider(a.ThemeProvider)

	default:
		err := fmt.Errorf("Unsupported tournament platform: %s", tournamentPlatform)
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	if cfgWidgets.Bracket.BracketId == "" {
		err := fmt.Errorf("No bracket ID for widget — enter a valid tournament URL")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	logger.Log(entityLogger.Debug,
		fmt.Sprintf("Widget will open bracket ID: %s", cfgWidgets.Bracket.BracketId))

	bracketService := service.NewBracketService(provider, renderer)
	a.WidgetServer.SetBracketService(bracketService)
	a.WidgetServer.SetBracketState(cfgWidgets.Bracket)

	a.mu.Lock()
	if a.bracketRunning {
		a.mu.Unlock()
		err := fmt.Errorf("Widget bracket is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.RenderBracket = renderer
	a.bracketRunning = true
	a.mu.Unlock()

	a.acquireWidgetServer()

	return nil
}

func (a *App) StopWidgetBracket() {
	a.mu.Lock()
	if !a.bracketRunning {
		a.mu.Unlock()
		return
	}
	a.bracketRunning = false
	a.mu.Unlock()

	a.releaseWidgetServer()
}
