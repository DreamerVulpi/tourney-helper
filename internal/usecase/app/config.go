package application

import (
	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/entity/locale/ui"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/version"
)

func (a *App) GetVersion() string {
	return strings.Replace(version.Current, "v", "", 1)
}

func (a *App) GetUiLocale(lang string) ui.Ui {
	switch strings.ToUpper(lang) {
	case "EN":
		return ui.En
	case "RU":
		return ui.Ru
	default:
		return ui.Ru
	}
}

func (a *App) LoadSettingsApp() (config.SettingsApplication, error) {
	path := config.GetAbsPath("config/settings.toml")
	cfg, err := config.LoadSettings(path)
	if err != nil {
		nullCfg := config.SettingsApplication{
			Language:              "EN",
			Theme:                 "Dark",
			CheckUpdatesOnStartUp: true,
			IgnoredVersion:        "",
		}
		return nullCfg, nil
	}
	a.Locale = &cfg
	return cfg, nil
}

func (a *App) SaveSettingsApp(cfg config.SettingsApplication) error {
	return config.SaveSettings(config.GetAbsPath("config/settings.toml"), cfg)
}

func (a *App) LoadSystemConfig() (config.ConfigMessenger, error) {
	path := config.GetAbsPath("config/config.toml")
	cfg, err := config.LoadConfig(path)
	if err != nil {
		nullCfg := config.ConfigMessenger{
			Discord: config.MessengerPlatform{
				Token:          "",
				ClientID:       "",
				SecretClient:   "",
				GuildID:        "",
				DebugChannelID: "",
				Roles: config.RolesID{
					Ru: "",
					En: "",
				},
			},
			Telegram: config.MessengerPlatform{
				Token:          "",
				ClientID:       "",
				SecretClient:   "",
				GuildID:        "",
				DebugChannelID: "",
				Roles: config.RolesID{
					Ru: "",
					En: "",
				},
			},
			DebugMode: config.DebugMode{
				Mode: false,
			},
			Db: config.Database{
				Dsn: "",
			},
		}
		config.SaveConfig(path, nullCfg)
		logger.Log(entityLogger.Warning, "The system configuration could not be loaded. It has been recreated")
		return nullCfg, nil
	}
	logger.Log(entityLogger.Success, "The system configuration has been successfully loaded")
	return cfg, nil
}

func (a *App) SaveSystemConfig(cfg config.ConfigMessenger) error {
	return config.SaveConfig(config.GetAbsPath("config/config.toml"), cfg)
}

func (a *App) LoadTournamentConfig() (config.ConfigTournament, error) {
	cfg, err := config.LoadTournament(config.GetAbsPath("config/tournament.toml"))
	if err != nil {
		nullCfg := config.ConfigTournament{
			Startgg: config.TournamentPlatform{
				Name:         "",
				ClientID:     "",
				SecretClient: "",
			},
			Challonge: config.TournamentPlatform{
				Name:         "",
				ClientID:     "",
				SecretClient: "",
			},
			UrlToTournament: "",
			Rules: config.RulesMatches{
				StandardFormat: 2,
				FinalsFormat:   3,
				Stage:          "Any",
				Rounds:         3,
				Duration:       60,
				Crossplatform:  false,
			},
			Stream: config.StreamLobby{
				Area:          "Any",
				Language:      "EN",
				Conn:          "Wired",
				Crossplatform: false,
				Passcode:      "0000",
			},
			Logo: config.Logo{
				Img: "",
			},
			Csv: config.Csv{
				NameFile: "",
			},
			Game: config.ConfigGame{
				Name: "",
			},
		}
		config.SaveTournament(config.GetAbsPath("config/tournament.toml"), nullCfg)
		logger.Log(entityLogger.Warning, "The tournament configuration could not be loaded. It has been recreated")
		return nullCfg, nil
	}
	logger.Log(entityLogger.Success, "The tournament configuration has been successfully loaded")
	return cfg, nil
}

func (a *App) SaveTournamentConfig(cfg config.ConfigTournament) error {
	return config.SaveTournament(config.GetAbsPath("config/tournament.toml"), cfg)
}
