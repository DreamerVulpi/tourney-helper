package widget

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/dreamervulpi/tourney-helper/config"
)

var themesPath = "/themes"

var directories = []string{
	"bracket" + themesPath,
}

func InitDirectories() error {
	for _, dir := range directories {
		path := filepath.Join("widget", dir)
		if err := createDir(config.GetAbsPath(path)); err != nil {
			return err
		}
	}

	return nil
}

func createDir(path string) error {
	if err := os.MkdirAll(path, 0755); err != nil {
		return fmt.Errorf("could not create widget directory %q: %w", path, err)
	}

	return nil
}
