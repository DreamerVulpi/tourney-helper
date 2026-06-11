package application

import (
	"strings"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/entity/locale/ui"
)

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

func (a *App) LoadSystemConfig() (config.ConfigMessenger, error) {
	path := config.GetAbsPath("config/config2.toml")
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
		return nullCfg, nil
	}
	return cfg, nil
}

func (a *App) SaveSystemConfig(cfg config.ConfigMessenger) error {
	return config.SaveConfig(config.GetAbsPath("config/config2.toml"), cfg)
}

func (a *App) LoadTournamentConfig() (config.ConfigTournament, error) {
	cfg, err := config.LoadTournament(config.GetAbsPath("config/tournament2.toml"))
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
				Waiting:        10,
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
		config.SaveTournament(config.GetAbsPath("config/tournament2.toml"), nullCfg)
		return nullCfg, nil
	}
	return cfg, nil
}

func (a *App) SaveTournamentConfig(cfg config.ConfigTournament) error {
	return config.SaveTournament(config.GetAbsPath("config/tournament2.toml"), cfg)
}
