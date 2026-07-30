package main

import (
	"errors"
	"fmt"
	"os"
	"time"

	"runtime/debug"

	"context"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	"github.com/dreamervulpi/tourney-helper/internal/db"
	"github.com/dreamervulpi/tourney-helper/internal/db/repo"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/bot/discord"
	usecaseDB "github.com/dreamervulpi/tourney-helper/internal/usecase/db"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/sender"
	"github.com/joho/godotenv"
)

func main() {
	logDir := "logs"
	err := logger.Init(logDir, true)
	if err != nil {
		fmt.Printf("Can't launch logging: %v\n", err)
		os.Exit(1)
	}
	defer logger.Close()

	defer func() {
		if r := recover(); r != nil {
			logger.Log(entityLogger.Info, fmt.Sprintf("Critical error\n Why? %v\n Stack:\n%s", r, debug.Stack()))
			fmt.Println("Programm closed with error. More details in folder logs")
		}
	}()

	if err := godotenv.Load(".env"); err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("LoadEnv: %v\n", err))
	}

	// ctx := context.Background()

	// // Challonge
	// chAuth := &auth.AuthClient{
	// 	Config:     auth.GetChallongeOauth2(),
	// 	TokenFile:  "token_challonge.json",
	// 	HTTPClient: &http.Client{},
	// }

	// // auth.TestChallongeCall(chAuth)
	// token, err := chAuth.GetAccessToken("token_challonge.json")
	// if err != nil {
	// 	logger.Log(entityLogger.Error, fmt.Sprintf("can't get token Challonge: %v\n", err)
	// }

	// ch := challonge.NewClient(chAuth.HTTPClient, token)
	// tournament, err := ch.GetTournament(ctx, "https://challonge.com/ru/tournamentdciii")
	// if err != nil {
	// 	logger.Log(entityLogger.Error, err.Error())
	// }
	// logger.Log(entityLogger.Info, tournament.Name)
	// logger.Log(entityLogger.Info, tournament.Description)

	// matches, err := ch.GetMatches(ctx, "https://challonge.com/ru/tournamentdciii")
	// logger.Log(entityLogger.Info, matches)

	// p, err := ch.GetParticipant(ctx, "https://challonge.com/ru/tournamentdciii", "112579133")
	// if err != nil {
	// 	logger.Log(entityLogger.Error, err)
	// }
	ctx := context.Background()
	oauthServer := auth.NewOAuthCallbackServer(
		auth.Addr,
	)
	oauthServer.Start()

	// Для Discord
	dsAuth := &auth.AuthClient{
		NamePlatform:   "discord",
		Config:         auth.GetDiscordOauth2(os.Getenv("DISCORD_CLIENT_ID"), os.Getenv("DISCORD_CLIENT_SECRET")),
		TokenFile:      "token_discord.json",
		CallbackPath:   "/discord/callback",
		CallbackServer: oauthServer,
	}
	dsAuth.Init(ctx)

	ggAuth := &auth.AuthClient{
		NamePlatform:   "startgg",
		Config:         auth.GetStartggOauth2(os.Getenv("STARTGG_CLIENT_ID"), os.Getenv("STARTGG_CLIENT_SECRET")),
		TokenFile:      "token_startgg.json",
		CallbackPath:   "/startgg/callback",
		CallbackServer: oauthServer,
	}
	ggAuth.Init(ctx)

	logger.Log(entityLogger.Info, fmt.Sprintln("Get data of profile..."))

	cfg, err := config.LoadConfig(config.GetAbsPath("config.toml"))
	if err != nil {
		logger.Log(entityLogger.Error, errors.New("not loaded: ").Error()+err.Error())
	} else {
		conn, err := db.NewPool()
		if err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return
		}
		tournament, err := config.LoadTournament(config.GetAbsPath("tournament.toml"))
		if err != nil {
			logger.Log(entityLogger.Info, fmt.Sprintf("not loaded: %v", err))
		} else {
			db := dbManager.Database{
				Conn:        conn,
				Participant: usecaseDB.Participant{Repo: &repo.Participants{Conn: conn}},
				Accounts:    usecaseDB.ParticipantAccounts{Repo: &repo.ParticipantAccounts{Conn: conn}},
				Stats:       usecaseDB.ParticipantStats{Repo: &repo.ParticipantStats{Conn: conn}},
				Bans:        usecaseDB.ParticipantBans{Repo: &repo.ParticipantBans{Conn: conn}},
				SentSets:    usecaseDB.SentSet{Repo: &repo.SentSet{Conn: conn}},
			}

			contacts, err := sender.LoadCSV(config.GetAbsPath(tournament.Csv.NameFile))
			if err != nil {
				logger.Log(entityLogger.Info, fmt.Sprintf("CSV isn't loaded: %v", err))
			}

			collectorStartgg := metrics.NewCollector()

			logger.Log(entityLogger.Info, fmt.Sprintf("Check config: %v", tournament.UrlToTournament))
			adapter, err := sender.GetTournamentAdapter(collectorStartgg, ggAuth, "Discord", tournament.UrlToTournament, cfg.DebugMode.Mode, tournament.Game.Name, contacts)
			if err != nil {
				logger.Log(entityLogger.Error, err.Error())
				return
			}

			collectorDiscord := metrics.NewCollector()
			dh := discord.Handler{Auth: dsAuth, Metrics: collectorDiscord}
			ctx := context.Background()
			meDiscordPlatform, err := dh.Auth.GetDiscordMe(ctx)
			if err != nil {
				logger.Log(entityLogger.Error, fmt.Sprintf("InitBot | Failed to get debug user: %v", err))
				return
			}

			limiterStartgg := rateLimiter.NewStartggLimiter(collectorStartgg)
			limiterDiscord := rateLimiter.NewDiscordLimiter(collectorDiscord)
			ns := sender.NewNotificationSystem(nil, adapter, &db, cfg.DebugMode.Mode, entitySender.Participant{
				MessengerID:    meDiscordPlatform.ID,
				MessengerLogin: meDiscordPlatform.Username,
				Locale:         "ru",
				GameName:       tournament.Game.Name,
			}, limiterDiscord, limiterStartgg, collectorDiscord, collectorStartgg, 5*time.Minute)

			dh.Ns = ns

			if cfg.DebugMode.Mode {
				logger.Log(entityLogger.Warning, fmt.Sprintf("DEBUG MODE ON - Test contact is %v on platform %v", meDiscordPlatform.Username, "Discord"))
			}
			if err := dh.Start(ctx, ggAuth, conn, cfg, tournament); err != nil {
				logger.Log(entityLogger.Error, err.Error())
			}
		}
	}
}
