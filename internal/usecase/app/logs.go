package application

import (
	"os"
	"strings"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func (a *App) Log(logType string, msg string) {
	logger.Log(logType, msg)
}

func parseLogLine(line string) (entityLogger.LogEntry, bool) {
	entry := entityLogger.LogEntry{
		Msg: line,
	}

	start := strings.Index(line, "[")
	end := strings.Index(line, "]")

	if start == -1 || end == -1 || end <= start {
		return entityLogger.LogEntry{}, false
	}

	entry.Type = line[start+1 : end]
	entry.Msg = strings.TrimSpace(line[end+1:])

	switch entry.Type {
	case entityLogger.Info,
		entityLogger.Success,
		entityLogger.Warning,
		entityLogger.Debug,
		entityLogger.Error:

		if strings.Contains(strings.ToLower(entry.Msg), "context canceled") {
			return entityLogger.LogEntry{}, false
		}

		fields := strings.Fields(line[:start])
		if len(fields) >= 2 {
			entry.Time = fields[1]
		}
		return entry, true
	default:
		return entityLogger.LogEntry{}, false
	}
}

func (a *App) GetLogs() ([]entityLogger.LogEntry, error) {
	path := logger.DevLogPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var logs []entityLogger.LogEntry

	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}

		entry, ok := parseLogLine(line)
		if !ok {
			continue
		}
		logs = append(logs, entry)
	}
	return logs, nil
}
