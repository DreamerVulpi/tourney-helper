package application

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/db"
	"github.com/dreamervulpi/tourney-helper/internal/db/repo"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	usecaseDB "github.com/dreamervulpi/tourney-helper/internal/usecase/db"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// IMPORTANT: Methods SwitchProfile/AddProfile/DeleteProfile/DublicateProfile
// Must be called only from the UI thread and only when no tool
// or widget is active. Calling them from background threads is prohibited.

func (a *App) emitProfileChanged() {
	if a.ctx != nil {
		wruntime.EventsEmit(a.ctx, "profile:changed", a.ActiveProfile)
	}
}

func (a *App) RenameProfile(oldName, newName string) error {
	a.profileMu.Lock()
	defer a.profileMu.Unlock()

	if a.switchingProfile {
		return fmt.Errorf("profile switch already in progress")
	}
	a.switchingProfile = true
	defer func() { a.switchingProfile = false }()

	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)

	if oldName == newName {
		return nil
	}

	wasActive := a.ActiveProfile == oldName

	// 1. Если переименовываем активный — закрываем соединение,
	//    чтобы файл БД не был залочен.
	if wasActive && a.Db != nil && a.Db.Conn != nil {
		if err := a.Db.Conn.Close(); err != nil {
			logger.Log(entityLogger.Warning, "failed to close old db: "+err.Error())
		}
		a.Db = nil
	}

	// 2. Пробуем переименовать
	if err := config.RenameProfile(oldName, newName); err != nil {
		// Откат: если был активным — переоткрываем под старым именем,
		// чтобы не оставить приложение без БД.
		if wasActive {
			if lerr := a.LoadProfile(); lerr != nil {
				logger.Log(entityLogger.Error, "reload after failed rename: "+lerr.Error())
			}
		}
		return err
	}

	// 3. Если переименовали активный — переоткрываем под новым именем
	if wasActive {
		a.ActiveProfile = newName
		if err := a.LoadProfile(); err != nil {
			return fmt.Errorf("reload after rename: %w", err)
		}
		a.emitProfileChanged()
	}

	logger.Log(entityLogger.Info, fmt.Sprintf("profile renamed: %q -> %q", oldName, newName))
	return nil
}

func (a *App) ShareProfile(name, dstZipPath string) error {
	return fmt.Errorf("not implemented")
}

func (a *App) SwitchProfile(name string) error {
	a.profileMu.Lock()
	defer a.profileMu.Unlock()

	if a.switchingProfile {
		return fmt.Errorf("profile switch already in progress")
	}
	a.switchingProfile = true
	defer func() { a.switchingProfile = false }()

	if name == a.ActiveProfile {
		return nil
	}

	if err := config.SetActiveProfile(name); err != nil {
		return err
	}

	a.ActiveProfile = name
	if err := a.LoadProfile(); err != nil {
		return err
	}

	a.emitProfileChanged()
	return nil
}

func (a *App) AddProfile(name string) error {
	a.profileMu.Lock()
	defer a.profileMu.Unlock()

	if a.switchingProfile {
		return fmt.Errorf("profile switch already in progress")
	}
	a.switchingProfile = true
	defer func() { a.switchingProfile = false }()

	if err := config.CreateProfile(name); err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("cannot create %v profile: %v", name, err.Error()))
		return err
	}

	if err := config.SetActiveProfile(name); err != nil {
		return err
	}

	a.ActiveProfile = name
	if err := a.LoadProfile(); err != nil {
		return err
	}

	a.emitProfileChanged()
	return nil
}

func (a *App) DeleteProfile(name string) error {
	a.profileMu.Lock()
	defer a.profileMu.Unlock()

	if a.ActiveProfile == name && a.Db != nil && a.Db.Conn != nil {
		_ = a.Db.Conn.Close()
		a.Db = nil
	}

	if err := config.DeleteProfile(name); err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("cannot delete %v profile: %v", name, err.Error()))
		return err
	}

	if a.ActiveProfile == name {
		newActive, err := config.GetActiveProfileName()
		if err != nil {
			return err
		}
		if newActive == "" {
			if err := config.CreateProfile(config.DefaultProfileName); err != nil {
				return err
			}
			newActive = config.DefaultProfileName
		}
		a.ActiveProfile = newActive
		if err := a.LoadProfile(); err != nil {
			return err
		}

		a.emitProfileChanged()
		return nil
	}
	return nil
}

func (a *App) LoadProfile() error {
	conn, err := db.NewPool(a.ActiveProfile)
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	newDb := dbManager.Database{
		Conn:        conn,
		Participant: usecaseDB.Participant{Repo: &repo.Participants{Conn: conn}},
		Accounts:    usecaseDB.ParticipantAccounts{Repo: &repo.ParticipantAccounts{Conn: conn}},
		Stats:       usecaseDB.ParticipantStats{Repo: &repo.ParticipantStats{Conn: conn}},
		Bans:        usecaseDB.ParticipantBans{Repo: &repo.ParticipantBans{Conn: conn}},
		SentSets:    usecaseDB.SentSet{Repo: &repo.SentSet{Conn: conn}},
	}

	if a.Db != nil && a.Db.Conn != nil {
		if err := a.Db.Conn.Close(); err != nil {
			logger.Log(entityLogger.Warning, "failed to close old db: "+err.Error())
		}
	}

	a.Db = &newDb

	settingsCfg, err := config.LoadSettings(a.ActiveProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "settings not loaded, using defaults: "+err.Error())
		settingsCfg = config.NewDefaultSettings()
	}
	a.SettingsCfg = settingsCfg

	widgetsCfg, err := config.LoadWidgets(a.ActiveProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "widgets configs not loaded, using defaults values: "+err.Error())
		widgetsCfg = config.NewDefaultWidgets()
	}
	a.WidgetsCfg = widgetsCfg

	toolsCfg, err := config.LoadTools(a.ActiveProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "tools configs not loaded, using defaults values: "+err.Error())
		toolsCfg = config.NewDefaultTools()
	}
	a.NotificationSystemCfg = &toolsCfg.NotificationSystem

	authorizationsCfg, err := config.LoadAuthorizations(a.ActiveProfile)
	if err != nil {
		logger.Log(entityLogger.Warning, "authorizations not loaded, using defaults values: "+err.Error())
		authorizationsCfg = config.NewEmptyAuthorizations()
	}
	a.AuthorizationsCfg = authorizationsCfg
	return nil
}

func (a *App) DuplicateProfile(source, target string) error {
	a.profileMu.Lock()
	defer a.profileMu.Unlock()

	if source == "" || target == "" {
		return fmt.Errorf("source and target names must be non-empty")
	}
	if source == target {
		return fmt.Errorf("source and target must differ")
	}

	srcDir := config.GetProfileDir(source)
	dstDir := config.GetProfileDir(target)

	if !config.FileExists(srcDir) {
		return fmt.Errorf("source profile %q does not exist", source)
	}
	if config.FileExists(dstDir) {
		return fmt.Errorf("target profile %q already exists", target)
	}

	// 1. Копируем всё, кроме файлов БД (их получим через VACUUM INTO)
	if err := copyProfileDir(srcDir, dstDir); err != nil {
		_ = os.RemoveAll(dstDir)
		return fmt.Errorf("copy profile dir: %w", err)
	}

	// 2. Копируем БД через VACUUM INTO — безопасно даже при активном WAL
	srcDbPath := filepath.Join(srcDir, config.ProfileDbFileName)
	dstDbPath := filepath.Join(dstDir, config.ProfileDbFileName)

	if err := vacuumInto(srcDbPath, dstDbPath); err != nil {
		_ = os.RemoveAll(dstDir)
		return fmt.Errorf("vacuum into: %w", err)
	}

	// 3. Регистрируем в реестре
	reg, err := config.LoadRegistry()
	if err != nil {
		_ = os.RemoveAll(dstDir)
		return err
	}

	now := time.Now()
	reg.Profiles = append(reg.Profiles, config.ProfileMeta{
		Name:         target,
		CreatedAt:    now,
		LastOpenedAt: now,
	})
	if err := config.SaveRegistry(reg); err != nil {
		_ = os.RemoveAll(dstDir)
		return err
	}

	logger.Log(entityLogger.Info, fmt.Sprintf("profile %q duplicated to %q", source, target))
	return nil
}

func (a *App) GetListProfiles() ([]config.ProfileMeta, error) {
	return config.ListProfiles()
}

func (a *App) GetActiveProfile() error {
	activeProfile, err := config.GetActiveProfileName()
	if err != nil || activeProfile == "" {
		if err := config.CreateProfile(config.DefaultProfileName); err != nil {
			logger.Log(entityLogger.Error, "cannot create default profile: "+err.Error())
			return err
		}
		activeProfile = config.DefaultProfileName
	}

	a.ActiveProfile = activeProfile
	logger.Log(entityLogger.Info, fmt.Sprintf("Active profile: %s", a.ActiveProfile))
	return nil
}

func (a *App) GetActiveProfileName() (string, error) {
	return config.GetActiveProfileName()
}

// copyProfileDir копирует дерево, исключая файлы БД и их WAL/SHM-спутники.
func copyProfileDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)

		// Пропускаем БД и её спутники
		if !info.IsDir() && isDbFile(info.Name()) {
			return nil
		}

		if info.IsDir() {
			return os.MkdirAll(target, info.Mode())
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, info.Mode())
	})
}

func isDbFile(name string) bool {
	if name == config.ProfileDbFileName {
		return true
	}
	return strings.HasSuffix(name, ".db-wal") || strings.HasSuffix(name, ".db-shm")
}

// vacuumInto делает консистентную копию БД, не трогая оригинал.
// Требует, чтобы dst ещё не существовал.
func vacuumInto(srcPath, dstPath string) error {
	src, err := sql.Open("sqlite", srcPath)
	if err != nil {
		return err
	}
	defer src.Close()

	// Проверим, что источник открывается
	if err := src.Ping(); err != nil {
		return fmt.Errorf("source db unreachable: %w", err)
	}

	// Экранируем одинарные кавычки в пути (SQLite требует '' внутри строки)
	safeDst := strings.ReplaceAll(dstPath, "'", "''")
	_, err = src.Exec(fmt.Sprintf("VACUUM INTO '%s'", safeDst))
	if err != nil {
		return err
	}
	return nil
}

func (a *App) GetSettings() config.SettingsApplicationCfg {
	return a.SettingsCfg
}

func (a *App) GetWidgets() config.WidgetsCfg {
	return a.WidgetsCfg
}

func (a *App) GetAuthorizations() config.AuthorizationsCfg {
	return a.AuthorizationsCfg
}

func (a *App) GetNotificationSystem() config.NotificationSystem {
	if a.NotificationSystemCfg == nil {
		return config.NotificationSystem{}
	}
	return *a.NotificationSystemCfg
}
