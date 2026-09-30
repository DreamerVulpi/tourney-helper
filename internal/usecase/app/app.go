package application

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"path/filepath"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	"github.com/dreamervulpi/tourney-helper/internal/entity/app"
	"github.com/dreamervulpi/tourney-helper/internal/entity/bot"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/sender"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/update"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/validator"
	"github.com/dreamervulpi/tourney-helper/internal/widget"
	"github.com/dreamervulpi/tourney-helper/internal/widget/renderer"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx              context.Context
	MessengerClient  *auth.AuthClient
	TournamentClient *auth.AuthClient
	Db               *dbManager.Database
	Locale           *config.SettingsApplication
	logUpdateTimer   *time.Timer
	OAuthServer      *auth.OAuthCallbackServer
	UpdateService    *update.Service
	UpdateManager    *update.Manager

	mu            sync.Mutex
	ns            *sender.NotificationSystem
	nsCancel      context.CancelFunc
	wCancel       context.CancelFunc
	activeBot     bot.BotHandler
	WidgetServer  *widget.Server
	RenderBracket renderer.BracketRenderer
	ThemeProvider *widget.ThemeProvider
	UrlValidator  *validator.Validator

	ActiveProfile        string
	ConfigSettings       config.SettingsApplication
	ConfigWidgets        config.ConfigWidgets
	ConfigTournament     *config.ConfigTournament
	ConfigAuthorizations config.ConfigAuthorizations
}

func NewApp() *App {
	return &App{
		ThemeProvider: widget.NewThemeProvider(""),
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	go a.CheckUpdate()
	go a.StartBanCleaner(a.ctx)
}

func (a *App) Shutdown(ctx context.Context) {
}

func (a *App) OpenURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}

func (a *App) OpenImportFile() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Import files",
				Pattern:     "*.json; *.csv",
			},
		},
	})
}
func (a *App) OpenImportImage() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Import files",
				Pattern:     "*.png; *.jpeg",
			},
		},
	})
}

func (a *App) InstallUpdate() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	return a.UpdateManager.Install(
		a.ctx,
		os.Getpid(),
		filepath.Dir(exePath),
		filepath.Base(exePath),
		func() {
			runtime.EventsEmit(
				a.ctx,
				"update-status",
				"restarting",
			)
			runtime.Quit(a.ctx)
		},
		func(downloaded int64, total int64) {
			runtime.EventsEmit(
				a.ctx,
				"update-download-progress",
				downloaded,
				total,
			)
		},
		func(status string) {
			runtime.EventsEmit(
				a.ctx,
				"update-status",
				status,
			)
		},
	)
}

func (a *App) ValidateTournamentURL(rawURL string) (app.ValidationResult, error) {
	r := a.UrlValidator.ValidateURL(rawURL)

	if !r.Valid && r.Platform == "unknown" {
		return app.ValidationResult{
			Valid:    false,
			Platform: r.Platform,
		}, fmt.Errorf("unsupported tournament platform")
	}

	return app.ValidationResult{
		Valid:    r.Valid,
		Platform: r.Platform,
	}, nil
}
