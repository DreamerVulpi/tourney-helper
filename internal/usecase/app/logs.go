package application

import (
	"os"
	"strings"
	"time"

	"github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	loggerEntity "github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	loggerUsecase "github.com/dreamervulpi/tourneyBot/internal/usecase/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) Log(logType string, msg string) {
	loggerUsecase.Log(logType, msg)

	select {
	case a.logUpdateCh <- struct{}{}:
	default:
	}
}

func parseLogLine(line string) (logger.LogEntry, bool) {
	entry := logger.LogEntry{
		Msg: line,
	}

	start := strings.Index(line, "[")
	end := strings.Index(line, "]")

	if start == -1 || end == -1 || end <= start {
		return logger.LogEntry{}, false
	}

	entry.Type = line[start+1 : end]
	entry.Msg = strings.TrimSpace(line[end+1:])

	switch entry.Type {
	case loggerEntity.Info,
		loggerEntity.Success,
		loggerEntity.Warning,
		loggerEntity.Error:
		fields := strings.Fields(line[:start])
		if len(fields) >= 2 {
			entry.Time = fields[1]
		}
		return entry, true
	default:
		return loggerEntity.LogEntry{}, false
	}
}

func (a *App) GetLogs() ([]logger.LogEntry, error) {
	path := loggerUsecase.DevLogPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var logs []logger.LogEntry

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

func (a *App) logNotifier() {
	for range a.logUpdateCh {
		time.Sleep(50 * time.Millisecond)
		runtime.EventsEmit(a.ctx, "logs-updated")
	}
}
