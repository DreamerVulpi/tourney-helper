package application

import (
	"context"
	"fmt"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/dbManager"
)

type App struct {
	ctx              context.Context
	ConfigTournament *config.ConfigTournament
	ConfigMessenger  *config.ConfigMessenger
	MessengerClient  *auth.AuthClient
	TournamentClient *auth.AuthClient
	Db               *dbManager.Database
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Shutdown(ctx context.Context) {
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
