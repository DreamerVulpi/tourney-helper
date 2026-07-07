package logger

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var (
	devFile *os.File
	mu      sync.Mutex
)

const (
	Info    = "INFO"
	Warning = "WARNING"
	Error   = "ERROR"
	Success = "SUCCESS"
)

func DevLogPath() string {
	if devFile == nil {
		return ""
	}
	return devFile.Name()
}

func Init(logDir string) error {
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("could not create log directory: %w", err)
	}

	currentTime := time.Now().Format("02-01-2006_15-04-05")
	var err error

	devPath := filepath.Join(logDir, fmt.Sprintf("tourneyHelper_dev_%s.log", currentTime))
	devFile, err = os.OpenFile(devPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("could not open log file: %w", err)
	}

	log.SetOutput(io.MultiWriter(os.Stdout, devFile))
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	Log(Info, "The logger has been initialized")
	return nil
}

func Close() error {
	mu.Lock()
	defer mu.Unlock()

	var err error
	if devFile != nil {
		if e := devFile.Close(); e != nil {
			err = e
		}
	}
	return err
}
