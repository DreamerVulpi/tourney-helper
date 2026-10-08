package config

import "time"

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

type WidgetsCfg struct {
	Bracket WidgetBracket `toml:"bracket" json:"bracket"`
}

// ============================================================
// TOURNAMENT (tournament.toml)
// ============================================================

type RulesMatches struct {
	StandardFormat int    `toml:"standardFormat" json:"standardFormat"`
	FinalsFormat   int    `toml:"finalsFormat" json:"finalsFormat"`
	Stage          string `toml:"stage" json:"stage"`
	Rounds         int    `toml:"rounds" json:"rounds"`
	Duration       int    `toml:"duration" json:"duration"`
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

type Csv struct {
	NameFile string `toml:"nameFile" json:"nameFile"`
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
	TournamentClientId string              `toml:"tournamentClientId" json:"tournamentClientId"`
	DeliveryClients    []DeliveryClientRef `toml:"deliveryClients" json:"deliveryClients"`
	UrlToTournament    string              `toml:"urlToTournament" json:"urlToTournament"`
	Rules              RulesMatches        `toml:"rules" json:"rules"`
	Stream             StreamLobby         `toml:"stream" json:"stream"`
	Logo               Logo                `toml:"logo" json:"logo"`
	Csv                Csv                 `toml:"csv" json:"csv"`
	Game               GameConfig          `toml:"game" json:"game"`
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
