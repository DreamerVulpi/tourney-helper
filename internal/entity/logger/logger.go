package logger

type LogEntry struct {
	Time string `json:"time"`
	Type string `json:"type"`
	Msg  string `json:"msg"`
}
