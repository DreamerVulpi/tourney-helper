package application

import (
	"strings"

	"fmt"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/entity/locale/ui"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/locale"
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

// ============================================================
// SETTINGS
// ============================================================

func (a *App) LoadSettingsApp() (config.SettingsApplicationCfg, error) {
	cfg, err := config.LoadSettings(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewDefaultSettings()
		_ = config.SaveSettings(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"The program's configuration settings could not be loaded. Default settings recreated")
		return nullCfg, nil
	}
	logger.Log(entityLogger.Success,
		"The program's configuration settings have been successfully loaded")
	a.Locale = &cfg
	return cfg, nil
}

func (a *App) SaveSettingsApp(cfg config.SettingsApplicationCfg) error {
	if err := config.SaveSettings(a.ActiveProfile, cfg); err != nil {
		return err
	}
	a.mu.Lock()
	a.SettingsCfg = cfg
	a.OAuthServer.SetLanguage(locale.Lang(a.SettingsCfg.Language))
	a.mu.Unlock()
	return nil
}

// ============================================================
// TOOLS
// ============================================================

func (a *App) LoadToolsCfg() (config.ToolsCfg, error) {
	cfg, err := config.LoadTools(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewDefaultTools()
		_ = config.SaveTools(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"The tools configuration could not be loaded. It has been recreated")
		return nullCfg, nil
	}
	logger.Log(entityLogger.Success,
		"The tools configuration has been successfully loaded")
	return cfg, nil
}

func (a *App) SaveToolsCfg(cfg config.ToolsCfg) error {
	if err := config.SaveTools(a.ActiveProfile, cfg); err != nil {
		return err
	}

	a.mu.Lock()
	a.NotificationSystemCfg = &cfg.NotificationSystem
	a.mu.Unlock()
	return nil
}

// ============================================================
// WIDGETS
// ============================================================

func (a *App) LoadWidgetsCfg() (config.WidgetsCfg, error) {
	cfg, err := config.LoadWidgets(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewDefaultWidgets()
		_ = config.SaveWidgets(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"Widgets configuration could not be loaded. It has been recreated")
		return nullCfg, nil
	}
	logger.Log(entityLogger.Success,
		"The widgets configuration has been successfully loaded")
	return cfg, nil
}

func (a *App) SaveWidgetsCfg(cfg config.WidgetsCfg) error {
	if err := config.SaveWidgets(a.ActiveProfile, cfg); err != nil {
		return err
	}
	a.mu.Lock()
	a.WidgetsCfg = cfg
	a.mu.Unlock()
	return nil
}

// ============================================================
// AUTHORIZATIONS
// ============================================================

func (a *App) LoadAuthorizations() (config.AuthorizationsCfg, error) {
	cfg, err := config.LoadAuthorizations(a.ActiveProfile)
	if err != nil {
		nullCfg := config.NewEmptyAuthorizations()
		_ = config.SaveAuthorizations(a.ActiveProfile, nullCfg)
		logger.Log(entityLogger.Warning,
			"Authorizations could not be loaded. Empty slots recreated")
		return nullCfg, nil
	}
	logger.Log(entityLogger.Success,
		"Authorizations has been successfully loaded")
	return cfg, nil
}

func (a *App) SaveAuthorizations(cfg config.AuthorizationsCfg) error {
	if err := config.SaveAuthorizations(a.ActiveProfile, cfg); err != nil {
		return err
	}
	a.mu.Lock()
	a.AuthorizationsCfg = cfg
	a.mu.Unlock()
	return nil
}

// SetSlotStatus — устанавливает статус слота и сохраняет конфиг.
// platformID: "startgg" | "challonge" | "discord" | "telegram"
func (a *App) SetSlotStatus(platformID string, slotIndex int, status config.AuthStatus, reason string) error {
	cfg := a.AuthorizationsCfg

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

	a.AuthorizationsCfg = cfg
	return a.SaveAuthorizations(cfg)
}
