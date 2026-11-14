package config

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// MatchFormat is a match format label such as "FT2" or "BO3".
// Older configs stored a plain integer (e.g. 2), which is normalized to "FT2".
type MatchFormat string

func (m *MatchFormat) UnmarshalTOML(value any) error {
	switch v := value.(type) {
	case int64:
		*m = MatchFormat(fmt.Sprintf("FT%d", v))
	case string:
		*m = normalizeMatchFormat(v)
	default:
		return fmt.Errorf("invalid match format: %v", value)
	}
	return nil
}

func (m *MatchFormat) UnmarshalJSON(data []byte) error {
	var text string
	if err := json.Unmarshal(data, &text); err == nil {
		*m = normalizeMatchFormat(text)
		return nil
	}

	var number int
	if err := json.Unmarshal(data, &number); err != nil {
		return err
	}
	*m = MatchFormat(fmt.Sprintf("FT%d", number))
	return nil
}

func normalizeMatchFormat(value string) MatchFormat {
	value = strings.ToUpper(strings.TrimSpace(value))
	if value == "" {
		return ""
	}
	if _, err := strconv.Atoi(value); err == nil {
		return MatchFormat("FT" + value)
	}
	return MatchFormat(value)
}

type AuthStatus string

const (
	AuthStatusAuthorized   AuthStatus = "authorized"
	AuthStatusUnauthorized AuthStatus = "unauthorized"
	AuthStatusExpired      AuthStatus = "expired"
	AuthStatusError        AuthStatus = "error"
	AuthStatusInvalid      AuthStatus = "invalid"
	AuthStatusPending      AuthStatus = "pending"
	AuthStatusUnknown      AuthStatus = "unknown"
	AuthStatusInProgress   AuthStatus = "inprogress"
)

// ============================================================
// SETTINGS
// ============================================================

type IntegrationsSelections struct {
	Notifications map[string][]string `toml:"notifications" json:"notifications"`
	DbPlayers     map[string][]string `toml:"dbPlayers" json:"dbPlayers"`
	WidgetBracket map[string][]string `toml:"widgetBracket" json:"widgetBracket"`
}

type SettingsApplicationCfg struct {
	Language               string                 `toml:"language" json:"language"`
	Theme                  string                 `toml:"theme" json:"theme"`
	CheckUpdatesOnStartUp  bool                   `toml:"checkUpdatesOnStartUp" json:"checkUpdatesOnStartUp"`
	IgnoredVersion         string                 `toml:"ignoredVersion" json:"ignoredVersion"`
	SidePanelCollapsed     bool                   `toml:"sidePanelCollapsed" json:"sidePanelCollapsed"`
	DebugMode              bool                   `toml:"debugMode" json:"debugMode"`
	IntegrationsSelections IntegrationsSelections `toml:"integrationsSelections" json:"integrationsSelections"`
}

// ============================================================
// WIDGETS
// ============================================================

type WidgetBracket struct {
	UrlToTournament string  `toml:"urlToTournament" json:"urlToTournament"`
	BracketId       string  `toml:"bracketId" json:"bracketId"`
	Theme           string  `toml:"theme" json:"theme"`
	ClearBackground bool    `toml:"clearBackground" json:"clearBackground"`
	HideStages      bool    `toml:"hideStages" json:"hideStages"`
	BracketMode     string  `toml:"bracketMode" json:"bracketMode"`
	Scale           float64 `toml:"scale" json:"scale"`
	AutoRefresh     bool    `toml:"autoRefresh" json:"autoRefresh"`
}

// TODO: Add ShowLogo, ShowFlag
type Side struct {
	TeamTag        string  `toml:"teamTag" json:"teamTag"`
	Name           string  `toml:"name" json:"name"`
	ResetIcon      string  `toml:"resetIcon" json:"resetIcon"`
	ResetIconData  string  `toml:"resetIconData" json:"resetIconData"`
	ResetIconScale float64 `toml:"resetIconScale" json:"resetIconScale"`
	LogoPath       string  `toml:"logoPath" json:"logoPath"`
	Flag           string  `toml:"flag" json:"flag"`
	PlateImage     string  `toml:"plateImage" json:"plateImage"`
	Points         int     `toml:"points" json:"points"`
	ScoreOffsetX   int     `toml:"scoreOffsetX" json:"scoreOffsetX"`
	ScoreOffsetY   int     `toml:"scoreOffsetY" json:"scoreOffsetY"`
	ScoreFontSize  int     `toml:"scoreFontSize" json:"scoreFontSize"`
	ShowLogo       bool    `toml:"showLogo" json:"showLogo"`
	ShowFlag       bool    `toml:"showFlag" json:"showFlag"`
	ShowReset      bool    `toml:"showReset" json:"showReset"`
}

type WidgetScoreboard struct {
	Theme        string  `toml:"theme" json:"theme"`
	TitleMatch   string  `toml:"titleMatch" json:"titleMatch"`
	FontFamily   string  `toml:"fontFamily" json:"fontFamily"`
	MainFontSize int     `toml:"mainFontSize" json:"mainFontSize"`
	HideLogos    bool    `toml:"hideLogos" json:"hideLogos"`
	HideFlags    bool    `toml:"hideFlags" json:"hideFlags"`
	Scale        float64 `toml:"scale" json:"scale"`
	SideGap      float64 `toml:"sideGap" json:"sideGap"`
	SideWidth    float64 `toml:"sideWidth" json:"sideWidth"`
	PlateMode    string  `toml:"plateMode" json:"plateMode"`
	Format       string  `toml:"format" json:"format"`
	P1           Side    `toml:"P1" json:"P1"`
	P2           Side    `toml:"P2" json:"P2"`
}

type WidgetsCfg struct {
	Bracket    WidgetBracket    `toml:"bracket" json:"bracket"`
	Scoreboard WidgetScoreboard `toml:"scoreboard" json:"scoreboard"`
}

// ============================================================
// TOURNAMENT (tournament.toml)
// ============================================================

type RulesMatches struct {
	StandardFormat MatchFormat `toml:"standardFormat" json:"standardFormat"`
	FinalsFormat   MatchFormat `toml:"finalsFormat" json:"finalsFormat"`
	Stage          string      `toml:"stage" json:"stage"`
	Rounds         int         `toml:"rounds" json:"rounds"`
	Duration       int         `toml:"duration" json:"duration"`
}

type StreamLobby struct {
	Area          string `toml:"area" json:"area"`
	Language      string `toml:"language" json:"language"`
	Conn          string `toml:"conn" json:"conn"`
	Crossplatform bool   `toml:"crossplatform" json:"crossplatform"`
	Passcode      string `toml:"passcode" json:"passcode"`
	LinkToLobby   string `toml:"linkToLobby" json:"linkToLobby"`
}

type Logo struct {
	Img string `toml:"img" json:"img"`
}

type GameConfig struct {
	Name string `toml:"name" json:"name"`
}

type DeliveryClientRef struct {
	Platform string `toml:"platform" json:"platform"`
	ClientId string `toml:"clientId" json:"clientId"`
}

// ============================================================
// Tools (tools.toml)
// ============================================================

type NotificationSystem struct {
	UrlToTournament string       `toml:"urlToTournament" json:"urlToTournament"`
	TournamentSlug  string       `toml:"tournamentSlug" json:"tournamentSlug"`
	BracketId       string       `toml:"bracketID" json:"bracketID"`
	Rules           RulesMatches `toml:"rules" json:"rules"`
	Stream          StreamLobby  `toml:"stream" json:"stream"`
	Logo            Logo         `toml:"logo" json:"logo"`
	Game            GameConfig   `toml:"game" json:"game"`
}

type ToolsCfg struct {
	NotificationSystem NotificationSystem `toml:"notificationSystem" json:"notificationSystem"`
}

// ============================================================
// AUTHORIZATIONS (authorizations.toml)
// ============================================================

// ClientCredentials — данные одного клиента + настройки бота для него.
// Все поля опциональны: если платформа турнирная — token/guildID/roles пустые.
// Если платформа мессенджер — clientID/secretClient опциональны.
type ClientCredentials struct {
	Name         string `toml:"name" json:"name"`
	ClientID     string `toml:"clientID,omitempty" json:"clientID,omitempty"`
	SecretClient string `toml:"secretClient,omitempty" json:"secretClient,omitempty"`

	// Bot-specific
	Token          string  `toml:"token,omitempty" json:"token,omitempty"`
	GuildID        string  `toml:"guildID,omitempty" json:"guildID,omitempty"`
	DebugChannelID string  `toml:"debugChannelID,omitempty" json:"debugChannelID,omitempty"`
	Roles          RolesID `toml:"roles,omitempty" json:"roles,omitempty"`

	// Auth state
	Status       AuthStatus `toml:"status" json:"status"`
	StatusReason string     `toml:"status,omitempty" json:"statusReason,omitempty"`
	LastAuthAt   *time.Time `toml:"lastAuthAt,omitempty" json:"lastAuthAt,omitempty"`
	Created      bool       `toml:"created" json:"created"`
}

type RolesID struct {
	Default string `toml:"default" json:"default"`
	En      string `toml:"en" json:"en"`
	Ru      string `toml:"ru" json:"ru"`
}

type PlatformAuthorizations struct {
	ActiveSlot int                 `toml:"activeSlot" json:"activeSlot"`
	Slots      []ClientCredentials `toml:"slots" json:"slots"`
}

func (p PlatformAuthorizations) GetSlotByIndex(idx int) (ClientCredentials, bool) {
	if idx < 0 || idx >= len(p.Slots) {
		return ClientCredentials{}, false
	}
	return p.Slots[idx], true
}

type AuthorizationsCfg struct {
	Startgg   PlatformAuthorizations `toml:"startgg" json:"startgg"`
	Challonge PlatformAuthorizations `toml:"challonge" json:"challonge"`
	Discord   PlatformAuthorizations `toml:"discord" json:"discord"`
	Telegram  PlatformAuthorizations `toml:"telegram" json:"telegram"`
}

// ============================================================
// PROFILE + REGISTRY
// ============================================================

type ProfileMeta struct {
	Name         string    `toml:"name" json:"name"`
	CreatedAt    time.Time `toml:"createdAt" json:"createdAt"`
	LastOpenedAt time.Time `toml:"lastOpenedAt" json:"lastOpenedAt"`
}

type ProfilesRegistry struct {
	Active   string        `toml:"active" json:"active"`
	Profiles []ProfileMeta `toml:"profiles" json:"profiles"`
}

type Profile struct {
	Meta           ProfileMeta
	Path           string
	Settings       SettingsApplicationCfg
	Widgets        WidgetsCfg
	Tools          ToolsCfg
	Authorizations AuthorizationsCfg
}
