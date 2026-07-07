package logger

import (
	"log"

	"fmt"
)

func writeLog(msg string) {
	if devFile == nil {
		return
	}

	log.Println(msg)
}

func Log(logType, msg string) {
	mu.Lock()
	defer mu.Unlock()

	writeLog(fmt.Sprintf("[%s] %s", logType, msg))
}
