package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

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

func (p *PlatformAuthorizations) GetSlotStatus(index int) AuthStatus {
	if index < 0 || index >= len(p.Slots) {
		return AuthStatusUnknown
	}
	return p.Slots[index].Status
}

func (p *PlatformAuthorizations) CountByStatus(status AuthStatus) int {
	n := 0
	for _, s := range p.Slots {
		if s.Status == status {
			n++
		}
	}
	return n
}

func (p *PlatformAuthorizations) HasAuthorized() bool {
	return p.CountByStatus(AuthStatusAuthorized) > 0
}

func IsSlotAuthorized(c ClientCredentials) bool {
	return c.Status == AuthStatusAuthorized
}

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
			Notifications: make(map[string][]string),
			DbPlayers:     make(map[string][]string),
			WidgetBracket: make(map[string][]string),
		},
	}
}

// EnsureScoreboardDefaults заполняет scoreboard стандартными значениями,
// если секция ещё ни разу не инициализировалась.
func (c *WidgetsCfg) EnsureScoreboardDefaults() bool {
	if c.Scoreboard.Theme != "" ||
		c.Scoreboard.Scale != 0 ||
		c.Scoreboard.Format != "" ||
		c.Scoreboard.P1.Name != "" ||
		c.Scoreboard.P2.Name != "" {
		return false
	}

	c.Scoreboard = NewDefaultWidgets().Scoreboard
	return true
}

const WidgetSlotCount = 5

func NewDefaultWidgets() WidgetsCfg {
	bracket := WidgetBracket{
		UrlToTournament: "",
		BracketId:       "",
		Theme:           "Default",
		ClearBackground: false,
		HideStages:      false,
		BracketMode:     "all",
		Scale:           1.0,
		AutoRefresh:     false,
	}

	scoreboard := WidgetScoreboard{
		Theme:        "default",
		TitleMatch:   "CUSTOM NAME",
		FontFamily:   "",
		MainFontSize: 24,
		HideLogos:    false,
		HideFlags:    false,
		Scale:        1.0,
		SideGap:      480,
		SideWidth:    460,
		PlateMode:    "builtin",
		Format:       "FT2",
		P1: Side{
			TeamTag:        "",
			Name:           "Player 1",
			ResetIcon:      "",
			ResetIconData:  "",
			ResetIconScale: 1,
			LogoPath:       "",
			Flag:           "",
			PlateImage:     "",
			Points:         0,
			ScoreFontSize:  28,
			ShowLogo:       true,
			ShowFlag:       true,
			ShowReset:      false,
		},
		P2: Side{
			TeamTag:        "",
			Name:           "Player 2",
			ResetIcon:      "",
			ResetIconData:  "",
			ResetIconScale: 1,
			LogoPath:       "",
			Flag:           "",
			PlateImage:     "",
			Points:         0,
			ScoreFontSize:  28,
			ShowLogo:       true,
			ShowFlag:       true,
			ShowReset:      false,
		},
	}

	cfg := WidgetsCfg{Bracket: bracket, Scoreboard: scoreboard}
	cfg.BracketSlots = make([]WidgetBracket, WidgetSlotCount)
	cfg.ScoreboardSlots = make([]WidgetScoreboard, WidgetSlotCount)
	cfg.BracketSlotNames = make([]string, WidgetSlotCount)
	cfg.ScoreboardSlotNames = make([]string, WidgetSlotCount)
	for i := 0; i < WidgetSlotCount; i++ {
		cfg.BracketSlots[i] = bracket
		cfg.ScoreboardSlots[i] = scoreboard
		cfg.BracketSlotNames[i] = fmt.Sprintf("Slot %d", i+1)
		cfg.ScoreboardSlotNames[i] = fmt.Sprintf("Slot %d", i+1)
	}

	return cfg
}

func ensureSlotCount[T any](slots *[]T, fallback T) {
	for len(*slots) < WidgetSlotCount {
		*slots = append(*slots, fallback)
	}
	if len(*slots) > WidgetSlotCount {
		*slots = (*slots)[:WidgetSlotCount]
	}
}

func ensureSlotNames(names *[]string) {
	for len(*names) < WidgetSlotCount {
		*names = append(*names, "")
	}
	if len(*names) > WidgetSlotCount {
		*names = (*names)[:WidgetSlotCount]
	}
	for i := range *names {
		if strings.TrimSpace((*names)[i]) == "" {
			(*names)[i] = fmt.Sprintf("Slot %d", i+1)
		}
	}
}

// EnsureSlots гарантирует ровно пять слотов для каждого виджета.
// При миграции старых конфигов текущая конфигурация сохраняется в активный слот.
func (c *WidgetsCfg) EnsureSlots() {
	if c.ActiveBracketSlot < 0 || c.ActiveBracketSlot >= WidgetSlotCount {
		c.ActiveBracketSlot = 0
	}
	if c.ActiveScoreboardSlot < 0 || c.ActiveScoreboardSlot >= WidgetSlotCount {
		c.ActiveScoreboardSlot = 0
	}

	defaults := NewDefaultWidgets()

	if len(c.BracketSlots) == 0 {
		c.BracketSlots = make([]WidgetBracket, WidgetSlotCount)
		for i := range c.BracketSlots {
			c.BracketSlots[i] = defaults.Bracket
		}
		c.BracketSlots[c.ActiveBracketSlot] = c.Bracket
	} else {
		ensureSlotCount(&c.BracketSlots, defaults.Bracket)
	}

	if len(c.ScoreboardSlots) == 0 {
		c.ScoreboardSlots = make([]WidgetScoreboard, WidgetSlotCount)
		for i := range c.ScoreboardSlots {
			c.ScoreboardSlots[i] = defaults.Scoreboard
		}
		c.ScoreboardSlots[c.ActiveScoreboardSlot] = c.Scoreboard
	} else {
		ensureSlotCount(&c.ScoreboardSlots, defaults.Scoreboard)
	}

	ensureSlotNames(&c.BracketSlotNames)
	ensureSlotNames(&c.ScoreboardSlotNames)
}

// SyncActiveSlots сохраняет текущие активные конфигурации в соответствующие слоты.
func (c *WidgetsCfg) SyncActiveSlots() {
	c.EnsureSlots()
	c.BracketSlots[c.ActiveBracketSlot] = c.Bracket
	c.ScoreboardSlots[c.ActiveScoreboardSlot] = c.Scoreboard
}

func NewDefaultTools() ToolsCfg {
	return ToolsCfg{
		NotificationSystem: NotificationSystem{
			UrlToTournament: "",
			Rules: RulesMatches{
				StandardFormat: "FT2",
				FinalsFormat:   "FT3",
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
