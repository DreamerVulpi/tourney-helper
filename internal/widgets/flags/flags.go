package flags

import (
	"embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
)

//go:embed *.png names.json
var embedded embed.FS

// RelDir — путь к директории флагов относительно папки собранного проекта.
const RelDir = "widgets/scoreboard/flags"

// Info — данные одного флага страны.
type Info struct {
	Code    string `json:"code"`
	Name    string `json:"name"`
	DataURL string `json:"dataUrl"`
}

// Dir возвращает абсолютный путь к директории флагов собранного проекта.
func Dir() string {
	return config.GetAbsPath(RelDir)
}

// Init создаёт директорию флагов и копирует туда отсутствующие PNG.
func Init() error {
	dir := Dir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create flags dir %q: %w", dir, err)
	}

	entries, err := embedded.ReadDir(".")
	if err != nil {
		return fmt.Errorf("read embedded flags: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".png") {
			continue
		}

		dst := filepath.Join(dir, entry.Name())
		if _, err := os.Stat(dst); err == nil {
			continue
		} else if !os.IsNotExist(err) {
			return fmt.Errorf("stat flag %q: %w", dst, err)
		}

		data, err := embedded.ReadFile(entry.Name())
		if err != nil {
			return fmt.Errorf("read embedded flag %q: %w", entry.Name(), err)
		}
		if err := os.WriteFile(dst, data, 0o644); err != nil {
			return fmt.Errorf("write flag %q: %w", dst, err)
		}
	}

	return nil
}

// List возвращает список всех флагов с названиями стран и data URL для UI.
func List() ([]Info, error) {
	names, err := loadNames()
	if err != nil {
		return nil, err
	}

	entries, err := embedded.ReadDir(".")
	if err != nil {
		return nil, fmt.Errorf("read embedded flags: %w", err)
	}

	result := make([]Info, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".png") {
			continue
		}

		code := strings.TrimSuffix(entry.Name(), ".png")
		data, err := embedded.ReadFile(entry.Name())
		if err != nil {
			return nil, fmt.Errorf("read embedded flag %q: %w", entry.Name(), err)
		}

		result = append(result, Info{
			Code:    code,
			Name:    names[code],
			DataURL: "data:image/png;base64," + base64.StdEncoding.EncodeToString(data),
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return strings.ToLower(result[i].Name) < strings.ToLower(result[j].Name)
	})

	return result, nil
}

// Read возвращает PNG-содержимое флага по коду.
func Read(code string) ([]byte, error) {
	code = normalizeCode(code)
	if !IsValidCode(code) {
		return nil, fmt.Errorf("unknown flag code %q", code)
	}
	return embedded.ReadFile(code + ".png")
}

// IsValidCode проверяет, существует ли флаг с таким кодом.
func IsValidCode(code string) bool {
	code = normalizeCode(code)
	if code == "" {
		return false
	}
	_, err := embedded.ReadFile(code + ".png")
	return err == nil
}

// FilePath возвращает путь к извлечённому PNG-файлу флага.
func FilePath(code string) string {
	return filepath.Join(Dir(), normalizeCode(code)+".png")
}

func normalizeCode(code string) string {
	code = strings.ToLower(strings.TrimSpace(code))
	code = strings.TrimSuffix(code, ".png")
	if path.Base(code) != code {
		return ""
	}
	return code
}

func loadNames() (map[string]string, error) {
	data, err := embedded.ReadFile("names.json")
	if err != nil {
		return nil, fmt.Errorf("read embedded flag names: %w", err)
	}

	names := make(map[string]string)
	if err := json.Unmarshal(data, &names); err != nil {
		return nil, fmt.Errorf("parse embedded flag names: %w", err)
	}
	return names, nil
}
