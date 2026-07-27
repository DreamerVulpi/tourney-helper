package bot

import "github.com/dreamervulpi/tourneyBot/internal/entity/locale/stages"

type Locale string

const (
	LocaleEn Locale = "en"
	LocaleRu Locale = "ru"
)

type LogMessage struct {
	Title                  string
	StatusSentNotification string
	SuccessfulMsgHeader    string
	FailMsgHeader          string
	SuccesfullSendedMsg    string
	FailedSentMsg          string
	UsuallyMsgHeader       string
}

type ContactMsg struct {
	Title            string
	FailedResult     string
	SuccessResult    string
	TourneyPlatform  string
	GameName         string
	GameNickname     string
	MessengerContact string
	MessengerLogin   string
}

type InviteMessage struct {
	Title                    string
	Description              string
	MessageHeader            string
	Nickname                 string
	GameID                   string
	Discord                  string
	CheckIn                  string
	Warning                  string
	SettingsHeader           string
	StandardFormat           string
	FinalsFormat             string
	FormatDescription        string
	FT                       string
	Stage                    string
	RandomStage              string
	Rounds                   string
	Duration                 string
	DurationCount            string
	Crossplatform            string
	CrossplatformStatusTrue  string
	CrossplatformStatusFalse string
}

type StreamLobbyMessage struct {
	Title                    string
	Description              string
	MessageHeader            string
	Warning                  string
	ParamsHeader             string
	Area                     string
	CloseArea                string
	Language                 string
	AnyLanguage              string
	SameLanguage             string
	TypeConnection           string
	Connection               Connection
	Crossplatform            string
	CrossplatformStatusTrue  string
	CrossplatformStatusFalse string
	Passcode                 string
	PasscodeTemplate         string
	StreamLink               string
	ListRegions              ListRegions
}

type Connection struct {
	Any string
	LAN string
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

type ViewDataMessage struct {
	Title               string
	Description         string
	MessageRulesHeader  string
	MessageStreamHeader string
	LogoTournament      string
}

type ErrorMessage struct {
	Input   string
	Respond string
	NoData  string
}

type ResponseMessage struct {
	Starting  string
	InProcess string
	Stopping  string
	Stopped   string
}

type Field struct {
	Name  string
	Emoji string
	URL   string
}

type Lang struct {
	InviteMessage      InviteMessage
	StreamLobbyMessage StreamLobbyMessage
	ViewDataMessage    ViewDataMessage
	ErrorMessage       ErrorMessage
	ResponseMessage    ResponseMessage
	LogMessage         LogMessage
	ContactMessage     ContactMsg
	DonateField        Field
	SubscribeField     Field
	Stages             stages.Stages
}
