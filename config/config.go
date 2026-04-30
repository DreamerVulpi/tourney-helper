package config

import (
	"os"

	"path/filepath"

	"strings"

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
	Ru string `toml:"ru" json:"ru"`
	En string `toml:"en" json:"en"`
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
	Waiting        int    `toml:"waiting" json:"waiting"`
}

type StreamLobby struct {
	Area          string `toml:"area" json:"area"`
	Language      string `toml:"language" json:"language"`
	Conn          string `toml:"connection" json:"connection"`
	Crossplatform bool   `toml:"crossplatform" json:"crossplatform"`
	Passcode      string `toml:"passcode" json:"passcode"`
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
	Startgg         TournamentPlatform `toml:"startggPlatform" json:"startggPlatform"`
	Challonge       TournamentPlatform `toml:"challongePlatform" json:"challongePlatform"`
	UrlToTournament string             `toml:"urlToTournament" json:"urlToTournament"`
	Rules           RulesMatches       `toml:"rules" json:"rules"`
	Stream          StreamLobby        `toml:"stream" json:"stream"`
	Logo            Logo               `toml:"logo" json:"logo"`
	Csv             Csv                `toml:"csv" json:"csv"`
	Game            ConfigGame         `toml:"game" json:"game"`
}

func GetAbsPath(fileName string) string {
	ex, err := os.Executable()
	if err != nil {
		return fileName
	}

	exPath := filepath.Dir(ex)

	if strings.Contains(exPath, "Temp") || strings.Contains(exPath, "go-build") {
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
