package application

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

// acquireWidgetServer увеличивает счётчик активных виджетов и запускает
// общий HTTP-сервер, если он ещё не запущен.
func (a *App) acquireWidgetServer() {
	a.widgetServerMu.Lock()
	defer a.widgetServerMu.Unlock()

	a.widgetServerRefs++
	if a.widgetServerRefs > 1 {
		return
	}

	logger.Log(entityLogger.Info, "Widget server starting on :8080")

	errCh := a.WidgetServer.StartAsync(":8080")
	go func() {
		err := <-errCh
		if err != nil && !errors.Is(err, http.ErrServerClosed) && !errors.Is(err, context.DeadlineExceeded) {
			logger.Log(entityLogger.Error, fmt.Sprintf("Widget server: %v", err))
		} else if err != nil && errors.Is(err, context.DeadlineExceeded) {
			logger.Log(entityLogger.Info, "Widget server stopped (context deadline exceeded during shutdown)")
		}
	}()
}

// releaseWidgetServer уменьшает счётчик активных виджетов и останавливает
// общий HTTP-сервер, когда не остаётся ни одного работающего виджета.
func (a *App) releaseWidgetServer() {
	a.widgetServerMu.Lock()
	defer a.widgetServerMu.Unlock()

	if a.widgetServerRefs > 0 {
		a.widgetServerRefs--
	}
	if a.widgetServerRefs > 0 {
		return
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	if err := a.WidgetServer.Stop(ctx); err != nil {
		if !errors.Is(err, context.DeadlineExceeded) {
			logger.Log(entityLogger.Error, err.Error())
		} else {
			logger.Log(entityLogger.Debug, "Widget server forced to stop due to timeout")
		}
	}
}
