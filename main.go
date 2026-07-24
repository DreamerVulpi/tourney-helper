package main

import (
	"embed"
	"fmt"
	"os"
	"runtime/debug"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/db"
	"github.com/dreamervulpi/tourneyBot/internal/db/repo"
	entityLogger "github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	application "github.com/dreamervulpi/tourneyBot/internal/usecase/app"
	usecaseDB "github.com/dreamervulpi/tourneyBot/internal/usecase/db"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/logger"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	if err := logger.Init(config.GetAbsPath("logs"), true); err != nil {
		fmt.Printf("Can't launch logging: %v\n", err)
		os.Exit(1)
	}
	defer logger.Close()

	if err := config.Init(config.GetAbsPath("config")); err != nil {
		logger.Log(entityLogger.Error, err.Error())
	}

	app := application.NewApp()
	conn, err := db.NewPool()
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return
	}

	defer func() {
		if r := recover(); r != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("Critical error\n Why? %v\n Stack:\n%s", r, debug.Stack()))
			logger.Log(entityLogger.Error, "Programm closed with error. More details in folder logs")
		}
	}()
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
