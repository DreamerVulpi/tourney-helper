package ui

type Ui struct {
	HeaderPanel             HeaderPanel
	SidePanel               SidePanel
	LogPanel                LogPanel
	NotificationSystemPanel NotificationSystemPanel
	DatabasePanel           DatabasePanel
	WidgetBracketPanel      WidgetBracketPanel
	ProfilesPanel           ProfilesPanel
	IntegrationsPanel       IntegrationsPanel
	ValidationAlertModal    ValidationAlertModal
	ProgressModal           ProgressModal
}

type HeaderPanel struct {
	Help              HelpModal
	About             AboutModal
	Update            UpdateModal
	Authorization     IntegrationsPanel
	MultiSelectClient MultiSelectClient
}

type ProfilesPanel struct {
	MultiSelectLabel            string
	Add                         string
	Delete                      string
	Duplicate                   string
	Share                       string
	Placeholder                 string
	DuplicateProfile            string
	NameNewProfileLabel         string
	PlaceholderProfile          string
	ConfirmButtonDuplicateLabel string
	SearchLabel                 string
	NoItemsLabel                string
	ValidationProfile           ValidationProfile
}

type SidePanel struct {
	ManagementTourmanets    string
	NotificationSystemLabel string
	DatabaseLabel           string
	WidgetOfBracketLabel    string
	WidgetOfScoreboardLabel string
	VersionLabel            string
	LogsLabel               string
	ClearButtonLabel        string
	IntegrationsLabel       string
	ProfilesLabel           string
	ProfilesLockedHint      string
}

type NotificationSystemPanel struct {
	MonitoringSystem     MonitoringSystem
	DebugModeSwitchLabel string
	Platform             Platform
	UrlToTournamentLabel string
	GenreOrGameLabel     string
	ListOfGamesLabel     string
	RulesOfTournament    RulesOfTournament
	LobbyLiveBroadcast   LobbyLiveBroadcast
	ConfigurationLogo    ConfigurationLogo
	Mailing              Mailing
	Logs                 NspLogs
}

type LogPanel struct {
	Label                            string
	ClearButtonLabel                 string
	LocaleLoaded                     string
	LocaleNotLoaded                  string
	MainConfigSuccessfulLoaded       string
	TournamentConfigSuccessfulLoaded string
	SettingsApplicationLoaded        string
	ErrorLoadingConfig               string
	NoLogs                           string
}

type DatabasePanel struct {
	AddButton                      AddButton
	SearchLineLabel                string
	Filters                        Filters
	Table                          Table
	ResetRatingButton              ResetRatingModal
	TotalCountNotesInDBLabel       string
	TotalCountBannedNotesInDBLabel string
	TotalCountRatingParticipants   string
}

type WidgetBracketPanel struct {
	UrlToBracketLabel     string
	ListOfBracketsLabel   string
	ListOfThemes          string
	Start                 string
	Stop                  string
	HideTheStages         string
	LinkOfWidget          string
	ClearBackground       string
	BracketDisplayMode    string
	AllMode               string
	WinnersMode           string
	LosersMode            string
	WidgetNotRunning      string
	ClickStartDescription string
	LoadBracket           string
	FetchData             string
	AutoRefresh           string
	ValidationUrlBracket  ValidationUrlBracket
}

type IntegrationsPanel struct {
	Platform              Platform
	SignInButtonLabel     string
	AuthorizeButtonLabel  string
	AuthorizationStatuses AuthorizationStatuses
	ClientsLabel          string
	EmptyFieldHeader      string
	EmptyFieldHint        string
	ClientSettings        string
	DeliveryMethodLabel   string
	TourneyLabel          string
}
