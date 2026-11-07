package application

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	widgetflags "github.com/dreamervulpi/tourney-helper/internal/widgets/flags"
)

// GetListFlags возвращает список флагов стран для выпадающего списка.
func (a *App) GetListFlags() ([]widgetflags.Info, error) {
	return widgetflags.List()
}

// LaunchWidgetScoreboard запускает сервер виджетов для scoreboard.
// Полноценный рендер виджета будет добавлен отдельной итерацией,
// сейчас сервер отдаёт заглушку по /widgets/scoreboard.
func (a *App) LaunchWidgetScoreboard() error {
	a.mu.Lock()
	if a.wCancel != nil || a.sCancel != nil {
		a.mu.Unlock()
		err := fmt.Errorf("Widget server is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	_, cancel := context.WithCancel(context.Background())
	a.sCancel = cancel
	a.mu.Unlock()

	go func() {
		logger.Log(entityLogger.Info, "Widget server starting on :8080")

		err := a.WidgetServer.Start(":8080")
		if err != nil && !errors.Is(err, http.ErrServerClosed) && !errors.Is(err, context.DeadlineExceeded) {
			logger.Log(entityLogger.Error, fmt.Sprintf("Widget server: %v", err))
		} else if err != nil && errors.Is(err, context.DeadlineExceeded) {
			logger.Log(entityLogger.Info, "Widget server stopped (context deadline exceeded during shutdown)")
		}
	}()

	return nil
}

func (a *App) StopWidgetScoreboard() {
	a.mu.Lock()
	cancel := a.sCancel
	a.sCancel = nil
	a.mu.Unlock()

	if cancel == nil {
		return
	}
	cancel()

	ctx, cancelShutdown := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancelShutdown()

	if err := a.WidgetServer.Stop(ctx); err != nil {
		if !errors.Is(err, context.DeadlineExceeded) {
			logger.Log(entityLogger.Error, err.Error())
		} else {
			logger.Log(entityLogger.Debug, "Widget server forced to stop due to timeout")
		}
	}
}
