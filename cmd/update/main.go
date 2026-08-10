package update

import (
	"fmt"
	"os"

	"strconv"

	"github.com/dreamervulpi/tourney-helper/internal/usecase/update"
)

func run() error {
	if len(os.Args) != 5 {
		return fmt.Errorf("usage: updater.exe <pid> <source> <target>")
	}

	pid, err := strconv.Atoi(os.Args[1])
	if err != nil {
		return fmt.Errorf("invalid pid: %w", err)
	}
	return update.NewUpdater().Run(
		pid,
		os.Args[2],
		os.Args[3],
		os.Args[4],
	)
}

func main() {
	if err := run(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
