package bot

import (
	"context"
	"database/sql"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
)

type BotHandler interface {
	Start(ctx context.Context, tourneyAuth *auth.AuthClient, conn *sql.DB, cfg config.ConfigMessenger, tournament config.ConfigTournament) error
	Stop() error
}
