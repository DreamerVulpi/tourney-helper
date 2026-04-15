package logger

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"
)

func Init(logDir string) (*os.File, error) {
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, fmt.Errorf("could not create log directory: %v", err)
	}

	currentTime := time.Now().Format("02-01-2006_15-04-05")
	logFilePath := filepath.Join(logDir, fmt.Sprintf("tourneyHelper_%s.log", currentTime))
	file, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, fmt.Errorf("could not open log file: %v", err)
	}

	multiWriter := io.MultiWriter(os.Stdout, file)
	log.SetOutput(multiWriter)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("--- Logger initialized ---")
	return file, nil
}
