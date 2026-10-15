package main

import (
	"embed"
	"fmt"
	"os"
	"runtime/debug"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	application "github.com/dreamervulpi/tourney-helper/internal/usecase/app"
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

	if errGetProfile := app.GetActiveProfile(); errGetProfile != nil {
		logger.Log(entityLogger.Error, errGetProfile.Error())
	}

	if errLoadProfile := app.LoadProfile(); errLoadProfile != nil {
		logger.Log(entityLogger.Error, errLoadProfile.Error())
	}

	errWailsRun := wails.Run(&options.App{
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

	if errWailsRun != nil {
		logger.Log(entityLogger.Error, errWailsRun.Error())
	}
}
