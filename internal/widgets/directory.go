package widget

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/flags"
)

var themesPath = "/themes"

var directories = []string{
	"bracket" + themesPath,
	"scoreboard" + themesPath,
	"scoreboard/flags",
	"scoreboard/logos",
	"scoreboard/planks",
}

func InitDirectories() error {
	for _, dir := range directories {
		path := filepath.Join("widgets", dir)
		if err := createDir(config.GetAbsPath(path)); err != nil {
			return err
		}
	}

	if err := flags.Init(); err != nil {
		return err
	}

	return nil
}

func createDir(path string) error {
	if err := os.MkdirAll(path, 0755); err != nil {
		return fmt.Errorf("could not create widget directory %q: %w", path, err)
	}

	return nil
}
