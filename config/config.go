package config

import (
	"bytes"
	"os"

	"path/filepath"

	"fmt"

	"time"

	"regexp"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/ilyakaznacheev/cleanenv"
)

const ProfileDbFileName = "tourneyHelperProject"

type MessengerPlatform struct {
	Token          string  `toml:"token" json:"token"`
	ClientID       string  `toml:"clientID" json:"clientID"`
	SecretClient   string  `toml:"secretClient,omitempty" json:"secretClient,omitempty"`
	GuildID        string  `toml:"guildID" json:"guildID"` // ID server/chat
	DebugChannelID string  `toml:"debugChannelID" json:"debugChannelID"`
	Roles          RolesID `toml:"roles" json:"roles"`
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

type TournamentPlatform struct {
	Name         string `toml:"name" json:"name"`
	ClientID     string `toml:"clientID" json:"clientID"`
	SecretClient string `toml:"secretClient" json:"secretClient,omitempty"`
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

// ============================================================
// ПУТИ
// ============================================================

// GetConfigRoot возвращает корневую папку конфигов (config/).
func GetConfigRoot() string {
	return GetAbsPath("config")
}

// GetProfilesRoot возвращает корневую папку профилей (profiles/).
func GetProfilesRoot() string {
	return GetAbsPath("profiles")
}

// GetRegistryPath возвращает путь к реестру профилей.
func GetRegistryPath() string {
	return filepath.Join(GetConfigRoot(), ProfilesRegistryFile)
}

// GetProfileDir возвращает папку конкретного профиля.
func GetProfileDir(name string) string {
	return filepath.Join(GetProfilesRoot(), name)
}

// GetProfileConfigsDir возвращает папку configs внутри профиля.
func GetProfileConfigsDir(name string) string {
	return filepath.Join(GetProfileDir(name), ProfileConfigsDir)
}

// GetProfileClientsDir возвращает папку clients внутри профиля.
func GetProfileClientsDir(name string) string {
	return filepath.Join(GetProfileDir(name), ProfileClientsDir)
}

// ============================================================
// INIT
// ============================================================

// Init — точка входа: создаёт структуру config/ + profiles/,
// если её ещё нет. Идемпотентна — повторный вызов ничего не ломает.
func Init() error {
	if err := os.MkdirAll(GetConfigRoot(), 0755); err != nil {
		return fmt.Errorf("could not create config dir: %w", err)
	}
	if err := os.MkdirAll(GetProfilesRoot(), 0755); err != nil {
		return fmt.Errorf("could not create profiles dir: %w", err)
	}

	// Реестр профилей
	if !FileExists(GetRegistryPath()) {
		if err := SaveRegistry(ProfilesRegistry{
			Active:   "",
			Profiles: []ProfileMeta{},
		}); err != nil {
			return fmt.Errorf("could not create registry: %w", err)
		}
	}

	return nil
}

// InitProfile создаёт файловую структуру для нового профиля.
// Если папка профиля уже существует — ничего не делает.
func InitProfile(name string) error {
	dir := GetProfileDir(name)

	if FileExists(dir) {
		return nil // уже есть
	}

	// Создаём подпапки
	if err := os.MkdirAll(GetProfileConfigsDir(name), 0755); err != nil {
		return fmt.Errorf("could not create configs dir: %w", err)
	}
	if err := os.MkdirAll(GetProfileClientsDir(name), 0755); err != nil {
		return fmt.Errorf("could not create clients dir: %w", err)
	}

	// Файлы профиля со значениями по умолчанию
	files := map[string]any{
		SettingsFile:       NewDefaultSettings(),
		WidgetsFile:        NewDefaultWidgets(),
		ToolsFile:          NewDefaultTools(),
		AuthorizationsFile: NewEmptyAuthorizations(),
	}

	for fileName, cfg := range files {
		path := filepath.Join(GetProfileConfigsDir(name), fileName)
		if err := writeTOML(path, cfg); err != nil {
			return fmt.Errorf("could not write %s: %w", fileName, err)
		}
	}

	return nil
}

// ============================================================
// ВСПОМОГАТЕЛЬНОЕ
// ============================================================

// writeTOML — атомарно пишет структуру в TOML-файл.
func writeTOML(path string, cfg any) error {
	var buf bytes.Buffer
	if err := toml.NewEncoder(&buf).Encode(cfg); err != nil {
		return err
	}
	return os.WriteFile(path, buf.Bytes(), 0644)
}

var profileNameRe = regexp.MustCompile(`^[A-Za-z0-9 _\-()#\p{Cyrillic}]+$`)

func ValidateProfileName(name string) error {
	name = strings.TrimSpace(name)

	if name == "" {
		return fmt.Errorf("profile name is empty")
	}
	if len([]rune(name)) > 64 {
		return fmt.Errorf("profile name is too long (max 64)")
	}
	if name == "." || name == ".." {
		return fmt.Errorf("invalid profile name")
	}
	if !profileNameRe.MatchString(name) {
		return fmt.Errorf("profile name contains invalid characters")
	}
	return nil
}

// ============================================================
// РЕЕСТР ПРОФИЛЕЙ
// ============================================================

// Load from config/profiles.toml
func LoadRegistry() (ProfilesRegistry, error) {
	var reg ProfilesRegistry
	path := GetRegistryPath()
	if !FileExists(path) {
		return ProfilesRegistry{Active: "", Profiles: []ProfileMeta{}}, nil
	}
	if _, err := toml.DecodeFile(path, &reg); err != nil {
		return ProfilesRegistry{}, err
	}
	return reg, nil
}

// Save in config/profiles.toml
func SaveRegistry(reg ProfilesRegistry) error {
	path := GetRegistryPath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	return writeTOML(path, reg)
}

func RenameProfile(oldName, newName string) error {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)

	if err := ValidateProfileName(newName); err != nil {
		return err
	}

	if oldName == newName {
		return nil
	}

	oldDir := GetProfileDir(oldName)
	newDir := GetProfileDir(newName)

	if !FileExists(oldDir) {
		return fmt.Errorf("profile %q does not exist", oldName)
	}
	if FileExists(newDir) {
		return fmt.Errorf("profile %q already exists", newName)
	}

	if err := os.Rename(oldDir, newDir); err != nil {
		return fmt.Errorf("rename dir: %w", err)
	}

	reg, err := LoadRegistry()
	if err != nil {
		_ = os.Rename(newDir, oldDir)
		return fmt.Errorf("load registry: %w", err)
	}

	found := false
	for i, p := range reg.Profiles {
		if p.Name == oldName {
			reg.Profiles[i].Name = newName
			reg.Profiles[i].LastOpenedAt = time.Now()
			found = true
			break
		}
	}
	if !found {
		_ = os.Rename(newDir, oldDir)
		return fmt.Errorf("profile %q not found in registry", oldName)
	}

	if reg.Active == oldName {
		reg.Active = newName
	}

	if err := SaveRegistry(reg); err != nil {
		_ = os.Rename(newDir, oldDir)
		return fmt.Errorf("save registry: %w", err)
	}

	return nil
}

func CreateProfile(name string) error {
	if name == "" {
		return fmt.Errorf("profile name cannot be empty")
	}

	name = strings.TrimSpace(name)
	if err := ValidateProfileName(name); err != nil {
		return err
	}

	if err := InitProfile(name); err != nil {
		return err
	}

	reg, err := LoadRegistry()
	if err != nil {
		return err
	}

	found := false
	for i, p := range reg.Profiles {
		if p.Name == name {
			reg.Profiles[i].LastOpenedAt = time.Now()
			found = true
			break
		}
	}

	if !found {
		now := time.Now()
		reg.Profiles = append(reg.Profiles, ProfileMeta{
			Name:         name,
			CreatedAt:    now,
			LastOpenedAt: now,
		})
	}

	if reg.Active == "" {
		reg.Active = name
	}

	return SaveRegistry(reg)
}

func DeleteProfile(name string) error {
	dir := GetProfileDir(name)
	if FileExists(dir) {
		if err := os.RemoveAll(dir); err != nil {
			return fmt.Errorf("could not remove profile dir: %w", err)
		}
	}

	reg, err := LoadRegistry()
	if err != nil {
		return err
	}

	filtered := reg.Profiles[:0]
	for _, p := range reg.Profiles {
		if p.Name != name {
			filtered = append(filtered, p)
		}
	}
	reg.Profiles = filtered

	if reg.Active == name {
		if len(reg.Profiles) > 0 {
			reg.Active = reg.Profiles[0].Name
		} else {
			reg.Active = ""
		}
	}

	return SaveRegistry(reg)
}

func SetActiveProfile(name string) error {
	reg, err := LoadRegistry()
	if err != nil {
		return err
	}

	found := false
	for i, p := range reg.Profiles {
		if p.Name == name {
			reg.Profiles[i].LastOpenedAt = time.Now()
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("profile %q not found in registry", name)
	}

	reg.Active = name
	return SaveRegistry(reg)
}

func ListProfiles() ([]ProfileMeta, error) {
	reg, err := LoadRegistry()
	if err != nil {
		return nil, err
	}
	return reg.Profiles, nil
}

func GetActiveProfileName() (string, error) {
	reg, err := LoadRegistry()
	if err != nil {
		return "", err
	}
	return reg.Active, nil
}

// Format: profiles/<profile>/clients/<profile>_<platform>_client_<N>.json
func GetClientTokenPath(profileName, platformID string, slotIndex int) string {
	fileName := fmt.Sprintf("%s_%s_client_%d.json", profileName, platformID, slotIndex+1)
	return filepath.Join(GetProfileClientsDir(profileName), fileName)
}

func DeleteClientToken(profileName, platformID string, slotIndex int) error {
	path := GetClientTokenPath(profileName, platformID, slotIndex)
	if !FileExists(path) {
		return nil
	}

	return os.Remove(path)
}
