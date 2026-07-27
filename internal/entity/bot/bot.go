package bot

import (
	"context"
	"database/sql"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
)

type BotHandler interface {
	Start(ctx context.Context, tourneyAuth *auth.AuthClient, conn *sql.DB, cfg config.ConfigMessenger, tournament config.ConfigTournament) error
	Stop() error
}
