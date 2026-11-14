package logos

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
)

const RelDir = "widgets/scoreboard/logos"

var allowedExts = map[string]bool{
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".webp": true,
	".gif":  true,
	".bmp":  true,
}

type Info struct {
	Name    string `json:"name"`
	DataURL string `json:"dataUrl"`
}

func Dir() string {
	return config.GetAbsPath(RelDir)
}

func Init() error {
	return os.MkdirAll(Dir(), 0o755)
}

func IsImageName(name string) bool {
	return allowedExts[strings.ToLower(filepath.Ext(name))]
}

func Path(name string) (string, error) {
	name = filepath.Base(strings.TrimSpace(name))
	if name == "" || name == "." || !IsImageName(name) {
		return "", fmt.Errorf("invalid logo name %q", name)
	}
	return filepath.Join(Dir(), name), nil
}

func List() ([]Info, error) {
	dir := Dir()
	entries, err := os.ReadDir(dir)
	if os.IsNotExist(err) {
		if mkErr := os.MkdirAll(dir, 0o755); mkErr != nil {
			return nil, fmt.Errorf("create logos dir: %w", mkErr)
		}
		return []Info{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read logos dir: %w", err)
	}

	result := make([]Info, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !IsImageName(entry.Name()) {
			continue
		}

		data, err := os.ReadFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			continue
		}

		result = append(result, NewInfo(entry.Name(), data))
	}

	sort.Slice(result, func(i, j int) bool {
		return strings.ToLower(result[i].Name) < strings.ToLower(result[j].Name)
	})

	return result, nil
}

func Read(name string) ([]byte, error) {
	path, err := Path(name)
	if err != nil {
		return nil, err
	}
	return os.ReadFile(path)
}

func NewInfo(name string, data []byte) Info {
	return Info{
		Name:    name,
		DataURL: "data:image/" + imageSubtype(name) + ";base64," + base64.StdEncoding.EncodeToString(data),
	}
}

func imageSubtype(name string) string {
	switch strings.ToLower(filepath.Ext(name)) {
	case ".jpg", ".jpeg":
		return "jpeg"
	case ".webp":
		return "webp"
	case ".gif":
		return "gif"
	case ".bmp":
		return "bmp"
	default:
		return "png"
	}
}
