package ui

type Ui struct {
	HeaderPanel             HeaderPanel
	SidePanel               SidePanel
	LogPanel                LogPanel
	NotificationSystemPanel NotificationSystemPanel
	DatabasePanel           DatabasePanel
	WidgetBracketPanel      WidgetBracketPanel
	ValidationAlertModal    ValidationAlertModal
	ProgressModal           ProgressModal
}

type HeaderPanel struct {
	Help          HelpModal
	About         AboutModal
	Update        UpdateModal
	Authorization AuthorizationModal
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
	UrlToBracketLabel   string
	ListOfBracketsLabel string
	ListOfThemes        string
	Start               string
	Stop                string
	HideTheStages       string
	LinkOfWidget        string
	ClearBackground     string
	LosersBracket       string
}

type AuthorizationModal struct {
	Title    string
	Label    string
	Platform Platform
}
