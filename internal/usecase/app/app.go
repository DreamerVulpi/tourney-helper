package application

import (
	"context"
	"sync"
	"time"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	"github.com/dreamervulpi/tourney-helper/internal/entity/bot"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/sender"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx              context.Context
	ConfigTournament *config.ConfigTournament
	ConfigMessenger  *config.ConfigMessenger
	MessengerClient  *auth.AuthClient
	TournamentClient *auth.AuthClient
	Db               *dbManager.Database
	Locale           *config.SettingsApplication
	logUpdateTimer   *time.Timer
	OAuthServer      *auth.OAuthCallbackServer

	mu        sync.Mutex
	ns        *sender.NotificationSystem
	nsCancel  context.CancelFunc
	activeBot bot.BotHandler
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

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
