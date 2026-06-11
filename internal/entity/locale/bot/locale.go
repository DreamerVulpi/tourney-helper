package bot

type LogMessage struct {
	Title                  string
	StatusSentNotification string
	SuccessfulMsgHeader    string
	FailMsgHeader          string
	SuccesfullSendedMsg    string
	FailedSentMsg          string
	UsuallyMsgHeader       string
	CheckIn                string
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
	AnyStage                 string
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
	AnyArea                  string
	CloseArea                string
	Language                 string
	AnyLanguage              string
	SameLanguage             string
	TypeConnection           string
	AnyConnection            string
	Crossplatform            string
	CrossplatformStatusTrue  string
	CrossplatformStatusFalse string
	Passcode                 string
	PasscodeTemplate         string
	StreamLink               string
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

type Lang struct {
	InviteMessage      InviteMessage
	StreamLobbyMessage StreamLobbyMessage
	ViewDataMessage    ViewDataMessage
	ErrorMessage       ErrorMessage
	ResponseMessage    ResponseMessage
	LogMessage         LogMessage
}
