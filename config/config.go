package config

import (
	"bytes"
	"os"

	"path/filepath"

	"strings"

	"fmt"

	"github.com/BurntSushi/toml"
	"github.com/ilyakaznacheev/cleanenv"
)

type MessengerPlatform struct {
	Token          string  `toml:"token" json:"token"`
	ClientID       string  `toml:"clientID" json:"clientID"`
	SecretClient   string  `toml:"secretClient,omitempty" json:"secretClient,omitempty"`
	GuildID        string  `toml:"guildID" json:"guildID"` // ID server/chat
	DebugChannelID string  `toml:"debugChannelID" json:"debugChannelID"`
	Roles          RolesID `toml:"roles" json:"roles"`
}

type RolesID struct {
	Default string `toml:"default" json:"default"`
	En      string `toml:"en" json:"en"`
	Ru      string `toml:"ru" json:"ru"`
}

type DebugMode struct {
	Mode bool `toml:"mode" json:"mode"`
}

type Database struct {
	Dsn string `toml:"dsn" json:"dsn"`
}

type ConfigMessenger struct {
	Discord   MessengerPlatform `toml:"discordbot" json:"discord"`
	Telegram  MessengerPlatform `toml:"telegrambot" json:"telegram"`
	DebugMode DebugMode         `toml:"debug" json:"debug"`
	Db        Database          `toml:"database" json:"database"`
}

type RulesMatches struct {
	StandardFormat int    `toml:"standardFormat" json:"standardFormat"`
	FinalsFormat   int    `toml:"finalsFormat" json:"finalsFormat"`
	Stage          string `toml:"stage" json:"stage"`
	Rounds         int    `toml:"rounds" json:"rounds"`
	Duration       int    `toml:"duration" json:"duration"`
	Crossplatform  bool   `toml:"crossplatform" json:"crossplatform"`
}

type StreamLobby struct {
	Area          string `toml:"area" json:"area"`
	Language      string `toml:"language" json:"language"`
	Conn          string `toml:"connection" json:"connection"`
	Crossplatform bool   `toml:"crossplatform" json:"crossplatform"`
	Passcode      string `toml:"passcode" json:"passcode"`
	LinkToLobby   string `toml:"linkToLobby" json:"linkToLobby"`
}

type Logo struct {
	Img string `toml:"img" json:"img"`
}

type Csv struct {
	NameFile string `toml:"nameFile" json:"nameFile"`
}

type ConfigGame struct {
	Name string `toml:"name" json:"name"`
}

type TournamentPlatform struct {
	Name         string `toml:"name" json:"name"`
	ClientID     string `toml:"clientID" json:"clientID"`
	SecretClient string `toml:"secretClient" json:"secretClient,omitempty"`
}

type ConfigTournament struct {
	Startgg         TournamentPlatform `toml:"startgg" json:"startgg"`
	Challonge       TournamentPlatform `toml:"challonge" json:"challonge"`
	UrlToTournament string             `toml:"urlToTournament" json:"urlToTournament"`
	Rules           RulesMatches       `toml:"rules" json:"rules"`
	Stream          StreamLobby        `toml:"stream" json:"stream"`
	Logo            Logo               `toml:"logo" json:"logo"`
	Csv             Csv                `toml:"csv" json:"csv"`
	Game            ConfigGame         `toml:"game" json:"game"`
}

type SettingsApplication struct {
	Language              string `toml:"language"`
	Theme                 string `toml:"theme"`
	CheckUpdatesOnStartUp bool   `toml:"checkUpdatesOnStartUp"`
	IgnoredVersion        string `toml:"ignoredVersion"`
	SidePanelCollapsed    bool   `toml:"sidePanelCollapsed"`
}

func GetAbsPath(fileName string) string {
	ex, err := os.Executable()
	if err != nil {
		return fileName
	}

	exPath := filepath.Dir(ex)

	if strings.Contains(exPath, "go-build") {
		return fileName
	}

	return filepath.Join(exPath, fileName)
}

func LoadConfig(file string) (ConfigMessenger, error) {
	var cfg ConfigMessenger

	err := cleanenv.ReadConfig(file, &cfg)
	if err != nil {
		return ConfigMessenger{}, err
	}

	return cfg, nil
}

func SaveConfig(file string, cfg ConfigMessenger) error {
	f, err := os.Create(file)
	if err != nil {
		return err
	}
	defer f.Close()
	return toml.NewEncoder(f).Encode(cfg)
}

func LoadSettings(file string) (SettingsApplication, error) {
	var l SettingsApplication
	err := cleanenv.ReadConfig(file, &l)
	if err != nil {
		return SettingsApplication{}, err
	}
	return l, nil
}

func SaveSettings(file string, cfg SettingsApplication) error {
	f, err := os.Create(file)
	if err != nil {
		return err
	}
	defer f.Close()
	return toml.NewEncoder(f).Encode(cfg)
}

func LoadTournament(file string) (ConfigTournament, error) {
	var l ConfigTournament

	err := cleanenv.ReadConfig(file, &l)
	if err != nil {
		return ConfigTournament{}, err
	}

	return l, nil
}

func SaveTournament(file string, cfg ConfigTournament) error {
	f, err := os.Create(file)
	if err != nil {
		return err
	}
	defer f.Close()
	return toml.NewEncoder(f).Encode(cfg)
}

func Init(configDir string) error {
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("could not create config directory: %w", err)
	}

	files := map[string]any{
		"config.toml": ConfigMessenger{
			Discord: MessengerPlatform{
				Token:          "",
				ClientID:       "",
				SecretClient:   "",
				GuildID:        "",
				DebugChannelID: "",
				Roles: RolesID{
					Default: "en",
					Ru:      "",
					En:      "",
				},
			},
			Telegram: MessengerPlatform{
				Token:          "",
				ClientID:       "",
				SecretClient:   "",
				GuildID:        "",
				DebugChannelID: "",
				Roles: RolesID{
					Default: "en",
					Ru:      "",
					En:      "",
				},
			},
			DebugMode: DebugMode{
				Mode: false,
			},
			Db: Database{
				Dsn: "",
			},
		},
		"tournament.toml": ConfigTournament{
			Startgg: TournamentPlatform{
				Name:         "",
				ClientID:     "",
				SecretClient: "",
			},
			Challonge: TournamentPlatform{
				Name:         "",
				ClientID:     "",
				SecretClient: "",
			},
			UrlToTournament: "",
			Rules: RulesMatches{
				StandardFormat: 2,
				FinalsFormat:   3,
				Stage:          "Any",
				Rounds:         3,
				Duration:       60,
				Crossplatform:  false,
			},
			Stream: StreamLobby{
				Area:          "Any",
				Language:      "EN",
				Conn:          "Wired",
				Crossplatform: false,
				Passcode:      "0000",
				LinkToLobby:   "",
			},
			Logo: Logo{
				Img: "",
			},
			Csv: Csv{
				NameFile: "",
			},
			Game: ConfigGame{
				Name: "",
			},
		},
		"settings.toml": SettingsApplication{
			Language:              "EN",
			Theme:                 "Dark",
			CheckUpdatesOnStartUp: true,
			IgnoredVersion:        "",
			SidePanelCollapsed:    false,
		},
	}

	for fileName, cfg := range files {
		path := filepath.Join(configDir, fileName)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			var buf bytes.Buffer

			if err := toml.NewEncoder(&buf).Encode(cfg); err != nil {
				return fmt.Errorf("could not encode %s: %w", fileName, err)
			}
			if err := os.WriteFile(path, buf.Bytes(), 0644); err != nil {
				return fmt.Errorf("could not create %s: %w", fileName, err)
			}
		}
	}
	return nil
}
