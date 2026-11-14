package application

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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

func (a *App) OpenLogsFolder() error {
	logDir := config.GetAbsPath("logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Open logs folder: %v", err))
		return fmt.Errorf("open logs folder: %w", err)
	}

	if err := exec.Command("explorer", logDir).Start(); err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Open logs folder: %v", err))
		return fmt.Errorf("open logs folder: %w", err)
	}

	return nil
}

func (a *App) ExportCurrentLog() (string, error) {
	srcPath := logger.DevLogPath()
	if srcPath == "" {
		err := fmt.Errorf("current log file is not available")
		logger.Log(entityLogger.Error, "Export current log: "+err.Error())
		return "", err
	}

	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export current log",
		DefaultFilename: filepath.Base(srcPath),
		Filters: []runtime.FileFilter{
			{DisplayName: "Log files (*.log)", Pattern: "*.log"},
		},
	})
	if err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Export current log: save dialog: %v", err))
		return "", err
	}
	if savePath == "" {
		return "", nil
	}

	data, err := os.ReadFile(srcPath)
	if err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Export current log: read: %v", err))
		return "", fmt.Errorf("read current log: %w", err)
	}
	if err := os.WriteFile(savePath, data, 0644); err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Export current log: write: %v", err))
		return "", fmt.Errorf("write exported log: %w", err)
	}

	logger.Log(entityLogger.Success, "Current log exported to "+savePath)

	return savePath, nil
}
