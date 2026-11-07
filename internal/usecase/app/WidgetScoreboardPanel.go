package application

import (
	"fmt"
	"sort"

	"github.com/dreamervulpi/tourney-helper/config"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	widgetflags "github.com/dreamervulpi/tourney-helper/internal/widgets/flags"
	scoreboardRenderer "github.com/dreamervulpi/tourney-helper/internal/widgets/renderer/scoreboard"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/service"
)

// GetListFlags возвращает список флагов стран для выпадающего списка.
func (a *App) GetListFlags() ([]widgetflags.Info, error) {
	return widgetflags.List()
}

// GetListScoreboardThemes возвращает список доступных тем scoreboard.
func (a *App) GetListScoreboardThemes() ([]string, error) {
	themes, err := a.ScoreboardThemeProvider.ListThemes()
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return nil, err
	}

	sort.Strings(themes)

	logger.Log(entityLogger.Debug, fmt.Sprintf(
		"GetListScoreboardThemes: found %d themes from %s",
		len(themes),
		a.ScoreboardThemeProvider.ExternalDir(),
	))

	return themes, nil
}

// LaunchWidgetScoreboard запускает сервер виджетов и подготавливает
// рендер scoreboard с текущим состоянием из конфигурации.
func (a *App) LaunchWidgetScoreboard(cfgWidgets config.WidgetsCfg) error {
	a.mu.Lock()
	if a.scoreboardRunning {
		a.mu.Unlock()
		err := fmt.Errorf("Widget scoreboard is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.mu.Unlock()

	renderer := scoreboardRenderer.NewRenderer(a.ScoreboardThemeProvider)
	scoreboardService := service.NewScoreboardService(renderer)

	a.WidgetServer.SetScoreboardService(scoreboardService)
	a.WidgetServer.SetScoreboardState(cfgWidgets.Scoreboard)

	a.mu.Lock()
	if a.scoreboardRunning {
		a.mu.Unlock()
		err := fmt.Errorf("Widget scoreboard is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.scoreboardRunning = true
	a.mu.Unlock()

	a.acquireWidgetServer()

	return nil
}

func (a *App) StopWidgetScoreboard() {
	a.mu.Lock()
	if !a.scoreboardRunning {
		a.mu.Unlock()
		return
	}
	a.scoreboardRunning = false
	a.mu.Unlock()

	a.releaseWidgetServer()
}
