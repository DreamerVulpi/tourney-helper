package config

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

// SetSlotStatus устанавливает статус слота.
func (p *PlatformAuthorizations) SetSlotStatus(index int, status AuthStatus, reason string) {
	if index < 0 || index >= len(p.Slots) {
		return
	}
	p.Slots[index].Status = status
	p.Slots[index].StatusReason = reason
	if status == AuthStatusAuthorized {
		now := time.Now()
		p.Slots[index].LastAuthAt = &now
	}
}

// GetSlotStatus возвращает статус слота.
func (p *PlatformAuthorizations) GetSlotStatus(index int) AuthStatus {
	if index < 0 || index >= len(p.Slots) {
		return AuthStatusUnknown
	}
	return p.Slots[index].Status
}

// CountByStatus — сколько слотов в заданном статусе.
func (p *PlatformAuthorizations) CountByStatus(status AuthStatus) int {
	n := 0
	for _, s := range p.Slots {
		if s.Status == status {
			n++
		}
	}
	return n
}

// HasAuthorized возвращает true, если есть хотя бы один авторизованный слот.
func (p *PlatformAuthorizations) HasAuthorized() bool {
	return p.CountByStatus(AuthStatusAuthorized) > 0
}

// IsSlotAuthorized — короткий хелпер для проверки.
func IsSlotAuthorized(c ClientCredentials) bool {
	return c.Status == AuthStatusAuthorized
}

// GetSlotWithIndex возвращает слот по индексу и ok=false, если индекс вне границ.
// В отличие от GetActiveSlotWithIndex, не проверяет IsSlotOccupied —
// эту проверку делает вызывающая сторона через .Token/.ClientID и т.п.
func (p PlatformAuthorizations) GetSlotWithIndex(index int) (ClientCredentials, bool) {
	if index < 0 || index >= len(p.Slots) {
		return ClientCredentials{}, false
	}
	return p.Slots[index], true
}

func NewEmptyPlatformAuthorizations() PlatformAuthorizations {
	slots := make([]ClientCredentials, SlotsPerPlatform)
	return PlatformAuthorizations{
		ActiveSlot: -1,
		Slots:      slots,
	}
}

func NewEmptyAuthorizations() AuthorizationsCfg {
	return AuthorizationsCfg{
		Startgg:   NewEmptyPlatformAuthorizations(),
		Challonge: NewEmptyPlatformAuthorizations(),
		Discord:   NewEmptyPlatformAuthorizations(),
		Telegram:  NewEmptyPlatformAuthorizations(),
	}
}

func NewDefaultSettings() SettingsApplicationCfg {
	return SettingsApplicationCfg{
		Language:              "EN",
		Theme:                 "Dark",
		CheckUpdatesOnStartUp: true,
		IgnoredVersion:        "",
		SidePanelCollapsed:    false,
		DebugMode:             false,
		IntegrationsSelections: IntegrationsSelections{
			Notifications: map[string][]string{},
			DbPlayers:     map[string][]string{},
			WidgetBracket: map[string][]string{},
		},
	}
}

func NewDefaultWidgets() WidgetsCfg {
	return WidgetsCfg{
		Bracket: WidgetBracket{
			UrlToTournament: "",
			BracketId:       "",
			Theme:           "Default",
			ClearBackground: false,
			HideStages:      false,
			BracketMode:     "all",
			Scale:           1.0,
			AutoRefresh:     false,
		},
	}
}

func NewDefaultTools() ToolsCfg {
	return ToolsCfg{
		NotificationSystem: NotificationSystem{
			UrlToTournament: "",
			Rules: RulesMatches{
				StandardFormat: 2,
				FinalsFormat:   3,
				Stage:          "Any",
				Rounds:         3,
				Duration:       60,
			},
			Stream: StreamLobby{
				Area:          "Any",
				Language:      "EN",
				Conn:          "Wired",
				Crossplatform: false,
				Passcode:      "0000",
				LinkToLobby:   "",
			},
			Logo: Logo{Img: ""},
			Game: GameConfig{Name: "tekken"},
		},
	}
}

func IsSlotOccupied(c ClientCredentials) bool {
	return c.ClientID != "" || c.Name != "" || c.SecretClient != "" || c.Token != ""
}

func EnsureClientDir(profileName string) error {
	dir := GetProfileClientsDir(profileName)
	return os.MkdirAll(dir, 0755)
}

// GetActiveSlotWithIndex возвращает активный слот и его индекс.
// Если активный слот не задан или пуст — ok=false.
func (p PlatformAuthorizations) GetActiveSlotWithIndex() (ClientCredentials, int, bool) {
	if p.ActiveSlot < 0 || p.ActiveSlot >= len(p.Slots) {
		return ClientCredentials{}, -1, false
	}
	c := p.Slots[p.ActiveSlot]
	if !IsSlotOccupied(c) {
		return ClientCredentials{}, -1, false
	}
	return c, p.ActiveSlot, true
}

// GetActiveClientCredentialsWithIndex — удобный хелпер для ConfigAuthorizations.
func (c AuthorizationsCfg) GetActiveClientCredentialsWithIndex(platformID string) (ClientCredentials, int, bool) {
	switch platformID {
	case "startgg":
		return c.Startgg.GetActiveSlotWithIndex()
	case "challonge":
		return c.Challonge.GetActiveSlotWithIndex()
	case "discord":
		return c.Discord.GetActiveSlotWithIndex()
	case "telegram":
		return c.Telegram.GetActiveSlotWithIndex()
	}
	return ClientCredentials{}, -1, false
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
