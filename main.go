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
	"github.com/dreamervulpi/tourney-helper/internal/usecase/update"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/validator"
	"github.com/dreamervulpi/tourney-helper/internal/version"
	"github.com/dreamervulpi/tourney-helper/internal/widget"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Build: Realise -> false | Dev -> true
	if err := logger.Init(config.GetAbsPath("logs"), version.DebugMode == "true"); err != nil {
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

	if err := config.Init(); err != nil {
		logger.Log(entityLogger.Error, err.Error())
	}

	provider := update.NewGithub(
		"DreamerVulpi",
		"tourney-helper",
	)
	updateService := update.NewService(
		provider,
		version.Current,
	)
	updateManager := update.NewManager(
		provider,
		update.NewDownloader(nil),
		update.NewInstaller(),
		update.NewLauncher(),
	)

	app := application.NewApp()
	app.UrlValidator = validator.NewValidator()
	app.UpdateService = updateService
	app.UpdateManager = updateManager
	widget.InitDirectories()
	app.WidgetServer = widget.NewServer()

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

	// ============================================================
	// 3. Загрузка активного профиля
	// ============================================================
	activeProfile, err := config.GetActiveProfileName()
	if err != nil || activeProfile == "" {
		// нет активного — создаём дефолтный
		if err := config.CreateProfile(config.DefaultProfileName); err != nil {
			logger.Log(entityLogger.Error, "cannot create default profile: "+err.Error())
			return
		}
		activeProfile = config.DefaultProfileName
	}
	app.ActiveProfile = activeProfile
	logger.Log(entityLogger.Info, fmt.Sprintf("Active profile: %s", app.ActiveProfile))

	// ============================================================
	// 4. Загрузка конфигов профиля
	// ============================================================
	settingsCfg, err := config.LoadSettings(activeProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "settings not loaded, using defaults: "+err.Error())
		settingsCfg = config.NewDefaultSettings()
		_ = config.SaveSettings(activeProfile, settingsCfg)
	}
	app.SettingsCfg = settingsCfg

	widgetsCfg, err := config.LoadWidgets(activeProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "widgets configs not loaded, using defaults values: "+err.Error())
		widgetsCfg = config.NewDefaultWidgets()
		_ = config.SaveWidgets(activeProfile, widgetsCfg)
	}
	app.WidgetsCfg = widgetsCfg

	toolsCfg, err := config.LoadTools(activeProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "tools configs not loaded, using defaults values: "+err.Error())
		toolsCfg = config.NewDefaultTools()
		_ = config.SaveTools(activeProfile, toolsCfg)
	}
	app.NotificationSystemCfg = &toolsCfg.NotificationSystem

	authorizationsCfg, err := config.LoadAuthorizations(activeProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "authorizations not loaded, using defaults values: "+err.Error())
		authorizationsCfg = config.NewEmptyAuthorizations()
		_ = config.SaveAuthorizations(activeProfile, authorizationsCfg)
	}
	app.AuthorizationsCfg = authorizationsCfg

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
