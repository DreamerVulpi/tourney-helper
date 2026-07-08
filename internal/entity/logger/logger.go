package logger

const (
	Info    = "INFO"
	Warning = "WARNING"
	Error   = "ERROR"
	Success = "SUCCESS"
)

type LogEntry struct {
	Time string `json:"time"`
	Type string `json:"type"`
	Msg  string `json:"msg"`
}
