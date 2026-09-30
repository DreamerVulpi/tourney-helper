package application

import (
	"strings"

	"fmt"

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

func (a *App) GetActiveProfileName() (string, error) {
	return config.GetActiveProfileName()
}

// ============================================================
// SETTINGS
// ============================================================

func (a *App) LoadSettingsApp() (config.SettingsApplication, error) {
	cfg, err := config.LoadSettings(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewDefaultSettings()
		_ = config.SaveSettings(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"Settings could not be loaded. Default settings recreated")
		return nullCfg, nil
	}
	a.Locale = &cfg
	return cfg, nil
}

func (a *App) SaveSettingsApp(cfg config.SettingsApplication) error {
	return config.SaveSettings(a.ActiveProfile, cfg)
}

// ============================================================
// TOURNAMENT
// ============================================================

func (a *App) LoadTournamentConfig() (config.ConfigTournament, error) {
	logger.Log(entityLogger.Info, a.ActiveProfile)
	cfg, err := config.LoadTournament(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewDefaultTournament()
		_ = config.SaveTournament(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"The tournament configuration could not be loaded. It has been recreated")
		return nullCfg, nil
	}
	logger.Log(entityLogger.Success,
		"The tournament configuration has been successfully loaded")
	return cfg, nil
}

func (a *App) SaveTournamentConfig(cfg config.ConfigTournament) error {
	return config.SaveTournament(a.ActiveProfile, cfg)
}

// ============================================================
// WIDGETS
// ============================================================

func (a *App) LoadWidgetsConfig() (config.ConfigWidgets, error) {
	cfg, err := config.LoadWidgets(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewDefaultWidgets()
		_ = config.SaveWidgets(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"Widgets configuration could not be loaded. It has been recreated")
		return nullCfg, nil
	}
	return cfg, nil
}

func (a *App) SaveWidgetsConfig(cfg config.ConfigWidgets) error {
	return config.SaveWidgets(a.ActiveProfile, cfg)
}

// ============================================================
// AUTHORIZATIONS
// ============================================================

func (a *App) LoadAuthorizations() (config.ConfigAuthorizations, error) {
	cfg, err := config.LoadAuthorizations(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewEmptyAuthorizations()
		_ = config.SaveAuthorizations(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"Authorizations could not be loaded. Empty slots recreated")
		return nullCfg, nil
	}
	return cfg, nil
}

func (a *App) SaveAuthorizations(cfg config.ConfigAuthorizations) error {
	return config.SaveAuthorizations(a.ActiveProfile, cfg)
}

// SetSlotStatus — устанавливает статус слота и сохраняет конфиг.
// platformID: "startgg" | "challonge" | "discord" | "telegram"
func (a *App) SetSlotStatus(platformID string, slotIndex int, status config.AuthStatus, reason string) error {
	cfg := a.ConfigAuthorizations

	var platform *config.PlatformAuthorizations
	switch platformID {
	case "startgg":
		platform = &cfg.Startgg
	case "challonge":
		platform = &cfg.Challonge
	case "discord":
		platform = &cfg.Discord
	case "telegram":
		platform = &cfg.Telegram
	default:
		logger.Log(entityLogger.Error, fmt.Sprintf("unknown platform: %s", platformID))
		return fmt.Errorf("unknown platform: %s", platformID)
	}

	platform.SetSlotStatus(slotIndex, status, reason)

	a.ConfigAuthorizations = cfg
	return config.SaveAuthorizations(a.ActiveProfile, cfg)
}
