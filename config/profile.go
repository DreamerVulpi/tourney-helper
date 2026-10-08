package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

// ============================================================
// SETTINGS
// ============================================================

func LoadSettings(profileName string) (SettingsApplicationCfg, error) {
	var cfg SettingsApplicationCfg
	path := filepath.Join(GetProfileConfigsDir(profileName), SettingsFile)
	if _, err := toml.DecodeFile(path, &cfg); err != nil {
		return SettingsApplicationCfg{}, err
	}
	return cfg, nil
}

func SaveSettings(profileName string, cfg SettingsApplicationCfg) error {
	path := filepath.Join(GetProfileConfigsDir(profileName), SettingsFile)
	return writeTOML(path, cfg)
}

// ============================================================
// WIDGETS
// ============================================================

func LoadWidgets(profileName string) (WidgetsCfg, error) {
	var cfg WidgetsCfg
	path := filepath.Join(GetProfileConfigsDir(profileName), WidgetsFile)
	if _, err := toml.DecodeFile(path, &cfg); err != nil {
		return WidgetsCfg{}, err
	}
	return cfg, nil
}

func SaveWidgets(profileName string, cfg WidgetsCfg) error {
	path := filepath.Join(GetProfileConfigsDir(profileName), WidgetsFile)
	return writeTOML(path, cfg)
}

// ============================================================
// TOOLS
// ============================================================

func LoadTools(profileName string) (ToolsCfg, error) {
	var cfg ToolsCfg
	path := filepath.Join(GetProfileConfigsDir(profileName), ToolsFile)
	fmt.Printf("[LoadTools] reading from: %s\n", path)

	if _, err := toml.DecodeFile(path, &cfg); err != nil {
		fmt.Printf("[LoadTools] ERROR: %v\n", err)
		return ToolsCfg{}, err
	}

	fmt.Printf("[LoadTools] loaded: %+v\n", cfg)
	return cfg, nil
}

func SaveTools(profileName string, cfg ToolsCfg) error {
	path := filepath.Join(GetProfileConfigsDir(profileName), ToolsFile)
	return writeTOML(path, cfg)
}

// ============================================================
// AUTHORIZATIONS
// ============================================================

func LoadAuthorizations(profileName string) (AuthorizationsCfg, error) {
	var cfg AuthorizationsCfg
	path := filepath.Join(GetProfileConfigsDir(profileName), AuthorizationsFile)
	if _, err := toml.DecodeFile(path, &cfg); err != nil {
		return AuthorizationsCfg{}, err
	}
	ensureSlots(&cfg)
	return cfg, nil
}

func SaveAuthorizations(profileName string, cfg AuthorizationsCfg) error {
	path := filepath.Join(GetProfileConfigsDir(profileName), AuthorizationsFile)
	return writeTOML(path, cfg)
}

// ensureSlots — на всякий случай выравнивает длину Slots до SlotsPerPlatform,
// если TOML был отредактирован вручную и в нём оказалось меньше элементов.
func ensureSlots(cfg *AuthorizationsCfg) {
	fix := func(p *PlatformAuthorizations) {
		// 1. Длина массива = SlotsPerPlatform (5)
		for len(p.Slots) < SlotsPerPlatform {
			p.Slots = append(p.Slots, ClientCredentials{})
		}
		if len(p.Slots) > SlotsPerPlatform {
			p.Slots = p.Slots[:SlotsPerPlatform]
		}

		// 2. Нормализация каждого слота
		for i := range p.Slots {
			s := &p.Slots[i]

			// Дефолтная локаль
			if s.Roles.Default == "" {
				s.Roles.Default = "en"
			}

			// Если слот НЕ создан явно и все поля пусты — это "blank"-слот
			if !s.Created {
				hasData := s.ClientID != "" ||
					s.Name != "" ||
					s.Token != "" ||
					s.SecretClient != "" ||
					s.GuildID != ""

				// Если данных нет — точно пустой слот
				if !hasData {
					s.Status = AuthStatusUnknown
					s.StatusReason = ""
					s.LastAuthAt = nil
					continue
				}

				// Данные есть, но Created=false (старые конфиги) — помечаем как созданный
				s.Created = true
			}

			// Слот создан. Нормализуем статус, если пустой.
			if s.Status == "" {
				s.Status = AuthStatusUnauthorized
			}

			// Миграция старой опечатки
			if string(s.Status) == "unauthorzed" {
				s.Status = AuthStatusUnauthorized
			}
		}

		// 3. Валидация ActiveSlot
		if p.ActiveSlot < -1 || p.ActiveSlot >= SlotsPerPlatform {
			p.ActiveSlot = -1
		}
	}

	fix(&cfg.Startgg)
	fix(&cfg.Challonge)
	fix(&cfg.Discord)
	fix(&cfg.Telegram)
}

// ============================================================
// WORKING WITH A WHOLE PROFILE
// ============================================================

// LoadProfile — читает все файлы профиля и собирает Profile.
func LoadProfile(name string) (Profile, error) {
	if !FileExists(GetProfileDir(name)) {
		return Profile{}, fmt.Errorf("profile %q does not exist", name)
	}

	settings, err := LoadSettings(name)
	if err != nil {
		return Profile{}, fmt.Errorf("settings: %w", err)
	}
	widgets, err := LoadWidgets(name)
	if err != nil {
		return Profile{}, fmt.Errorf("widgets: %w", err)
	}
	tools, err := LoadTools(name)
	if err != nil {
		return Profile{}, fmt.Errorf("tools: %w", err)
	}
	auths, err := LoadAuthorizations(name)
	if err != nil {
		return Profile{}, fmt.Errorf("authorizations: %w", err)
	}

	// Add load database

	// Метаданные из реестра
	reg, _ := LoadRegistry()
	meta := ProfileMeta{Name: name}
	for _, p := range reg.Profiles {
		if p.Name == name {
			meta = p
			break
		}
	}

	return Profile{
		Meta:           meta,
		Path:           GetProfileDir(name),
		Settings:       settings,
		Widgets:        widgets,
		Tools:          tools,
		Authorizations: auths,
	}, nil
}

// ============================================================
// GUARD: файл профиля существует?
// ============================================================

func mustProfileConfigPath(profileName, fileName string) string {
	dir := GetProfileConfigsDir(profileName)
	_ = os.MkdirAll(dir, 0755) // на всякий случай
	return filepath.Join(dir, fileName)
}
