package ui

type Ui struct {
	HeaderPanel             HeaderPanel
	SidePanel               SidePanel
	LogPanel                LogPanel
	NotificationSystemPanel NotificationSystemPanel
	DatabasePanel           DatabasePanel
	ValidationAlertModal    ValidationAlertModal
}

type HeaderPanel struct {
	HelpLabel  string
	AboutLabel string
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
	DebugModeSwitchLabel string
	Platform             Platform
	UrlToTournamentLabel string
	GenreOrGameLabel     string
	ListOfGamesLabel     string
	RulesOfTournament    RulesOfTournament
	LobbyLiveBroadcast   LobbyLiveBroadcast
	ConfigurationLogo    ConfigurationLogo
	Mailing              Mailing
}

type LogPanel struct {
	Label            string
	ClearButtonLabel string
}
type DatabasePanel struct {
	AddButton                      AddButton
	SearchLineLabel                string
	Filters                        Filters
	HeaderTable                    HeaderTable
	ResetRatingButton              ResetRatingModal
	TotalCountNotesInDBLabel       string
	TotalCountBannedNotesInDBLabel string
}
