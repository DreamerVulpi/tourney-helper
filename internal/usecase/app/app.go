package application

import (
	"context"
	"sync"
	"time"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
	"github.com/dreamervulpi/tourneyBot/internal/entity/bot"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/sender"
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
	logUpdateCh      chan struct{}

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
	a.logUpdateCh = make(chan struct{}, 1)

	go a.logNotifier()
	go a.StartBanCleaner(a.ctx)
}

func (a *App) Shutdown(ctx context.Context) {
}
