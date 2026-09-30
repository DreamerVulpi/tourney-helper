package config

import "time"

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

// GetActiveSlot возвращает активный ClientCredentials для платформы.
// Если активный слот не задан или пуст — возвращает пустой ClientCredentials
// и false вторым значением.
func (p PlatformAuthorizations) GetActiveSlot() (ClientCredentials, bool) {
	if p.ActiveSlot < 0 || p.ActiveSlot >= len(p.Slots) {
		return ClientCredentials{}, false
	}
	c := p.Slots[p.ActiveSlot]
	if !IsSlotOccupied(c) {
		return ClientCredentials{}, false
	}
	return c, true
}

// GetActiveClientCredentials — удобный хелпер для ConfigAuthorizations.
// platformID: "startgg" | "challonge" | "discord" | "telegram"
func (c ConfigAuthorizations) GetActiveClientCredentials(platformID string) (ClientCredentials, bool) {
	switch platformID {
	case "startgg":
		return c.Startgg.GetActiveSlot()
	case "challonge":
		return c.Challonge.GetActiveSlot()
	case "discord":
		return c.Discord.GetActiveSlot()
	case "telegram":
		return c.Telegram.GetActiveSlot()
	}
	return ClientCredentials{}, false
}
func NewEmptyPlatformAuthorizations() PlatformAuthorizations {
	slots := make([]ClientCredentials, SlotsPerPlatform)
	return PlatformAuthorizations{
		ActiveSlot: -1,
		Slots:      slots,
	}
}

func NewEmptyAuthorizations() ConfigAuthorizations {
	return ConfigAuthorizations{
		Startgg:   NewEmptyPlatformAuthorizations(),
		Challonge: NewEmptyPlatformAuthorizations(),
		Discord:   NewEmptyPlatformAuthorizations(),
		Telegram:  NewEmptyPlatformAuthorizations(),
	}
}

func NewDefaultSettings() SettingsApplication {
	return SettingsApplication{
		Language:              "EN",
		Theme:                 "Dark",
		CheckUpdatesOnStartUp: true,
		IgnoredVersion:        "",
		SidePanelCollapsed:    false,
		DebugMode:             false,
	}
}

func NewDefaultWidgets() ConfigWidgets {
	return ConfigWidgets{
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

func NewDefaultTournament() ConfigTournament {
	return ConfigTournament{
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
		Csv:  Csv{NameFile: ""},
		Game: ConfigGame{Name: ""},
	}
}

func IsSlotOccupied(c ClientCredentials) bool {
	return c.ClientID != "" || c.Name != "" || c.SecretClient != "" || c.Token != ""
}
