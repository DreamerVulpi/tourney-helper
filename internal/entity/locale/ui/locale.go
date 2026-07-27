package ui

import "github.com/dreamervulpi/tourneyBot/internal/entity/locale/stages"

type NspLogs struct {
	NotificationDeliveryStopped string
	LaunchNewsletterInDebugMode string
	ErrorDuringTheMailing       string
	LaunchNewsletter            string
}

type LobbyLiveBroadcast struct {
	Label              string
	RegionLabel        string
	ListRegions        ListRegions
	LanguageLabel      string
	CrossplatformLabel string
	ListCrossplatform  ListCrossplatform
	TypeConnection     TypeConnection
	AccessCodeLabel    string
}

type TypeConnection struct {
	Label string
	Any   string
	Lan   string
}

type Management struct {
	Label  string
	Edit   string
	Ban    string
	Unban  string
	Delete string
	Copy   string
	Copied string
}

type Table struct {
	Nickname               string
	GameID                 string
	Region                 string
	Language               string
	Rating                 string
	Contacts               string
	UpdatedAt              string
	ReasonBan              string
	DescriptionBan         string
	DateBan                string
	IsExpiring             string
	EmptyDescription       string
	TimeRemains            TimeRemains
	Management             Management
	LogsActions            LogsActions
	NoData                 string
	NoDataAccordingFilters string
	LoadingDataPlayers     string
}

type LogsActions struct {
	Add          string
	AddBan       string
	Edit         string
	Ban          string
	Unban        string
	Delete       string
	Rating       string
	UpdateRating string
	Err          string
}

type TimeRemains struct {
	JustNow string
	MinAgo  string
	HourAgo string
}

type Filters struct {
	All     string
	Rating  string
	BanList string
}

type AddButton struct {
	ErrorFillParams          string
	OkButtonLabel            string
	Label                    string
	One                      string
	EditTitle                string
	AddBanTitle              string
	EditBanTitle             string
	ImportFile               ImportFileModalWindow
	ConfirmDurationBan       string
	BanLabel                 string
	AddBanFields             AddBanFields
	AddContactOfMessenger    AddContactOfMessenger
	AddDataOfTourneyPlatform AddDataOfTourneyPlatform
	AddModalWindow           AddModalWindow
	BanTitle                 string
	BanButtonLabel           string
	UnbanTitle               string
	UnbanButtonLabel         string
	UnbanMsg                 string
	DeleteTitle              string
	DeleteButtonLabel        string
	DeleteMsg                string
	ResetRatingTitle         string
	ResetRatingButtonLabel   string
}

type ImportFileModalWindow struct {
	Label                         string
	Title                         string
	BanTitle                      string
	NameFile                      string
	TypeFile                      string
	TargetRegistry                string
	TargetBanList                 string
	TargetDatabase                string
	DescriptionImport             string
	DescriptionCSV                string
	RequirementsCSV               string
	FileFormat                    string
	FileBanFormat                 string
	DescriptionJSON               string
	SchemaFieldsJSONLabel         string
	SchemaFieldsBanJsonLabel      string
	SchemaCopyButtonLabel         string
	SchemaCopiedButtonLabel       string
	StartImportButtonLabel        string
	StartImportBannedButtonLabel  string
	StartImportBanListButtonLabel string
	LoadingImportFileModalWindows LoadingImportFileModalWindows
	OnlyJsonCSV                   string
}

type ValidationAlertModal struct {
	ErrorFillParams string
	OkButtonLabel   string
}

type LoadingImportFileModalWindows struct {
	InitImportFileMsg        string
	WriteParticipantsInDBMsg string
	SuccessImportDBMsg       string
	SuccessImportBanListMsg  string
	ErrorImportFileMsg       string
	CriticalFailureStatus    string
	StatusInProcess          string
	CloseButtonLabel         string
	DoneButtonLabel          string
	Strings                  string
	Warning                  string
	WarningStatusText        string
}

type AddModalWindow struct {
	Nickname                    string
	GameID                      string
	Region                      string
	ListRegions                 ListRegions
	Language                    string
	Rating                      string
	AddContactOfMessenger       string
	ContactOfMessengerLabel     string
	AddDataOfTourneyPlatform    string
	DataOfTourneyPlatformLabel  string
	CreateNoteButtonLabel       string
	EditNoteButtonLabel         string
	EditBanNoteButtonLabel      string
	SaveChangesButtonLabel      string
	ProcessingButtonLabel       string
	BanAndSaveButtonLabel       string
	ErrEmptyNickname            string
	ErrEmptyGameID              string
	ErrActivateMessengerNoLogin string
	ErrActivateTourneyNoLogin   string
	RequireMsgNickname          string
	RequireMsgGameID            string
}

type AddBanFields struct {
	ViolationCategoryLabel    string
	PermanentBanLabel         string
	ListViolationCategories   ListViolationCategories
	ListUnitsOfMeasurement    ListUnitsOfMeasurement
	ValidityPeriodLabel       string
	UnitOfMeasurementLabel    string
	DescriptionViolationLabel string
	DescriptionTip            string
}

type ListViolationCategories struct {
	UsingSoftwareOrCheats string
	ToxicBehavior         string
	ViolationOfRules      string
	SabotageMatches       string
	Smurfing              string
}

type ListUnitsOfMeasurement struct {
	Days   string
	Months string
}

type AddContactOfMessenger struct {
	Label       string
	Description string
	Login       string
}

type AddDataOfTourneyPlatform struct {
	Label       string
	Description string
	Nickname    string
}

type ConfigurationLogo struct {
	Label         string
	UrlImageLabel string
}

type Platform struct {
	AuthorizeStatePlatform       AuthorizeStatePlatform
	RequireMsgMessengerPlatform  string
	RequireMsgTournamentPlatform string
	LaunchMsg                    string
	SuccessMsg                   string
	ErrMsg                       string
	TokenBot                     string
	Messenger                    string
	Tourney                      string
	DownloadSettings             string
	RedirectURL                  string
	ParamsBot                    string
}

type AuthorizeStatePlatform struct {
	Authorized   string
	Unauthorized string
}

type Mailing struct {
	Debug                 string
	Start                 string
	AttentionDebugModeMsg string
	Stop                  string
}

type RulesOfTournament struct {
	Label          string
	StandardFormat string
	FinalFormat    string
	Rounds         string
	Time           string
	Seconds        string
	Stage          string
	ListStages     stages.Stages
}

type ListRegions struct {
	Any          string
	Europe       string
	Asia         string
	NorthAmerica string
	SouthAmerica string
	Africa       string
	Other        string
	ND           string
}

type ListCrossplatform struct {
	Yes string
	No  string
}

type ResetRatingModal struct {
	Label                   string
	Title                   string
	Message                 string
	Attension               string
	ResetRaitingButtonLabel string
}

type AboutModal struct {
	Label              string
	Title              string
	Description        string
	Version            string
	Developer          string
	Frontend           string
	Backend            string
	License            string
	CheckUpdates       string
	Documentation      string
	ReportBug          string
	DonateOnProject    string
	DonateLink         string
	SubscribeOnProject string
	SubscribeLink      string
	CloseButtonLabel   string
}

type HelpQA struct {
	Question string
	Answer   string
}

type HelpPageNotificationSystem struct {
	InitialSetup         HelpQA
	HowIsWorks           HelpQA
	WhatIsDebugMode      HelpQA
	WhatCanDo            HelpQA
	HowGetDataForStartgg HelpQA
	HowGetDataForDiscord HelpQA
	UsuallyUsing         HelpQA
}

type HelpPageDatabase struct {
	WhatIsDatabase HelpQA
	HowUse         HelpQA
}

type HelpModal struct {
	Label                      string
	Title                      string
	CloseButtonLabel           string
	HelpPageNotificationSystem HelpPageNotificationSystem
	HelpPageDatabase           HelpPageDatabase
}
