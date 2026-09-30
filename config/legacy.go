package config

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/ilyakaznacheev/cleanenv"
)

// ============================================================
// LEGACY TYPES — только для миграции.
// После успешной миграции этот файл можно удалить.
// ============================================================

type legacyMessengerPlatform struct {
	Token          string        `toml:"token"`
	ClientID       string        `toml:"clientID"`
	SecretClient   string        `toml:"secretClient,omitempty"`
	GuildID        string        `toml:"guildID"`
	DebugChannelID string        `toml:"debugChannelID"`
	Roles          legacyRolesID `toml:"roles"`
}

type legacyRolesID struct {
	Default string `toml:"default"`
	En      string `toml:"en"`
	Ru      string `toml:"ru"`
}

type legacyDebugMode struct {
	Mode bool `toml:"mode"`
}

type legacyDatabase struct {
	Dsn string `toml:"dsn"`
}

type legacyConfigMessenger struct {
	Discord   legacyMessengerPlatform `toml:"discordbot"`
	Telegram  legacyMessengerPlatform `toml:"telegrambot"`
	DebugMode legacyDebugMode         `toml:"debug"`
	Db        legacyDatabase          `toml:"database"`
}

type legacyTournamentPlatform struct {
	Name         string `toml:"name"`
	ClientID     string `toml:"clientID"`
	SecretClient string `toml:"secretClient,omitempty"`
}

// legacyConfigTournament — плоская старая структура (всё в одном файле).
type legacyConfigTournament struct {
	WidgetBracket   WidgetBracket            `toml:"widgetBracket"`
	Startgg         legacyTournamentPlatform `toml:"startgg"`
	Challonge       legacyTournamentPlatform `toml:"challonge"`
	UrlToTournament string                   `toml:"urlToTournament"`
	Rules           RulesMatches             `toml:"rules"`
	Stream          StreamLobby              `toml:"stream"`
	Logo            Logo                     `toml:"logo"`
	Csv             Csv                      `toml:"csv"`
	Game            ConfigGame               `toml:"game"`
}

// ============================================================
// LEGACY LOADERS
// ============================================================

func LoadLegacyMessenger(file string) (legacyConfigMessenger, error) {
	var cfg legacyConfigMessenger
	if err := cleanenv.ReadConfig(file, &cfg); err != nil {
		return legacyConfigMessenger{}, err
	}
	return cfg, nil
}

func LoadLegacyTournament(file string) (legacyConfigTournament, error) {
	var cfg legacyConfigTournament
	if err := cleanenv.ReadConfig(file, &cfg); err != nil {
		return legacyConfigTournament{}, err
	}
	return cfg, nil
}

func LoadLegacySettings(file string) (SettingsApplication, error) {
	var cfg SettingsApplication
	if err := cleanenv.ReadConfig(file, &cfg); err != nil {
		return SettingsApplication{}, err
	}
	return cfg, nil
}

// ============================================================
// PATH HELPERS
// ============================================================

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

func FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
