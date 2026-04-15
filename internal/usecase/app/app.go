package application

import (
	"context"
	"fmt"

	"github.com/dreamervulpi/tourneyBot/internal/auth"
)

type App struct {
	ctx              context.Context
	MessengerClient  *auth.AuthClient
	TournamentClient *auth.AuthClient
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	// logDir := "../logs"
	// _, err := logger.Init(logDir)
	// if err != nil {
	// 	fmt.Printf("Can't launch logging: %v\n", err)
	// 	os.Exit(1)
	// }
}

func (a *App) Shutdown(ctx context.Context) {
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
