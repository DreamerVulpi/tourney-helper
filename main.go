package main

import (
	"embed"
	"fmt"
	"os"
	"runtime/debug"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	"github.com/dreamervulpi/tourney-helper/internal/db"
	"github.com/dreamervulpi/tourney-helper/internal/db/repo"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	application "github.com/dreamervulpi/tourney-helper/internal/usecase/app"
	usecaseDB "github.com/dreamervulpi/tourney-helper/internal/usecase/db"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Build: Realise -> false | Dev -> true
	if err := logger.Init(config.GetAbsPath("logs"), false); err != nil {
		fmt.Printf("Can't launch logging: %v\n", err)
		os.Exit(1)
	}
	defer logger.Close()

	defer func() {
		if r := recover(); r != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("Critical error\n Why? %v\n Stack:\n%s", r, debug.Stack()))
			logger.Log(entityLogger.Error, "Programm closed with error. More details in folder logs")
		}
	}()

	if err := config.Init(config.GetAbsPath("config")); err != nil {
		logger.Log(entityLogger.Error, err.Error())
	}

	app := application.NewApp()
	app.OAuthServer = auth.NewOAuthCallbackServer(auth.Addr)
	app.OAuthServer.Start()

	conn, err := db.NewPool()
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return
	}

	db := dbManager.Database{
		Conn:        conn,
		Participant: usecaseDB.Participant{Repo: &repo.Participants{Conn: conn}},
		Accounts:    usecaseDB.ParticipantAccounts{Repo: &repo.ParticipantAccounts{Conn: conn}},
		Stats:       usecaseDB.ParticipantStats{Repo: &repo.ParticipantStats{Conn: conn}},
		Bans:        usecaseDB.ParticipantBans{Repo: &repo.ParticipantBans{Conn: conn}},
		SentSets:    usecaseDB.SentSet{Repo: &repo.SentSet{Conn: conn}},
	}
	app.Db = &db

	cfgMessenger, err := config.LoadConfig(config.GetAbsPath("config/config.toml"))
	if err != nil {
		logger.Log(entityLogger.Error, "not loaded messenger config: "+err.Error())
	}
	cfgTournament, err := config.LoadTournament(config.GetAbsPath("config/tournament.toml"))
	if err != nil {
		logger.Log(entityLogger.Error, "not loaded tournament config: "+err.Error())
	}

	app.ConfigMessenger = &cfgMessenger
	app.ConfigTournament = &cfgTournament

	err = wails.Run(&options.App{
		Title:     "TourneyHelper",
		MinWidth:  1280,
		MinHeight: 720,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.Startup,
		OnShutdown:       app.Shutdown,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
	}
}
