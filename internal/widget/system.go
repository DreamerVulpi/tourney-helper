package widget

import (
	"embed"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
)

//go:embed system.css
var SystemCSS string

//go:embed themes/bracket/*.css
var builtinThemes embed.FS

const DefaultThemeName = "default"

// DefaultThemesDir — path to other themes (binary)
const DefaultThemesDir = "widget/bracket/themes"

// ThemeProvider access to CSS themes
type ThemeProvider struct {
	externalDir string
}

// If externalDir is empty — using DefaultThemesDir.
func NewThemeProvider(externalDir string) *ThemeProvider {
	if externalDir == "" {
		externalDir = DefaultThemesDir
	}

	externalDir = resolveThemesDir(externalDir)

	return &ThemeProvider{
		externalDir: externalDir,
	}
}

// ListThemes gaves list names themes (without format .css).
func (p *ThemeProvider) ListThemes() ([]string, error) {
	themes := make(map[string]struct{})

	// Internal themes
	entries, err := builtinThemes.ReadDir("themes/bracket")
	if err != nil {
		return nil, fmt.Errorf("read builtin themes: %w", err)
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".css") {
			continue
		}
		themes[strings.TrimSuffix(name, ".css")] = struct{}{}
	}

	// Custom themes
	if entries, err := os.ReadDir(p.externalDir); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}
			name := entry.Name()
			if !strings.HasSuffix(name, ".css") {
				continue
			}
			themes[strings.TrimSuffix(name, ".css")] = struct{}{}
		}
	} else if !os.IsNotExist(err) {
		return nil, fmt.Errorf("read external themes: %w", err)
	} else {
		fmt.Printf("[DEBUG] ListThemes: external dir doesn't not exist: %s\n", p.externalDir)
	}

	result := make([]string, 0, len(themes))
	for name := range themes {
		result = append(result, name)
	}

	return result, nil
}

// GetThemeCSS - get name of theme
func (p *ThemeProvider) GetThemeCSS(name string) (string, error) {
	if name == "" {
		name = DefaultThemeName
	}

	// Defend - path traversal
	name = path.Base(name)
	if name == "." || name == "/" || name == "" {
		return "", fmt.Errorf("invalid theme name")
	}

	filename := filepath.Join(p.externalDir, name+".css")
	if data, err := os.ReadFile(filename); err == nil {
		return string(data), nil
	} else if !os.IsNotExist(err) {
		return "", fmt.Errorf("read external theme %q: %w", name, err)
	}

	builtinPath := fmt.Sprintf("themes/bracket/%s.css", name)
	data, err := builtinThemes.ReadFile(builtinPath)
	if err != nil {
		return "", fmt.Errorf("theme %q not found: %w", name, err)
	}

	return string(data), nil
}

func (p *ThemeProvider) HasTheme(name string) bool {
	_, err := p.GetThemeCSS(name)
	return err == nil
}

func resolveThemesDir(dir string) string {
	if filepath.IsAbs(dir) {
		return dir
	}

	exe, err := os.Executable()
	if err != nil {
		return dir
	}

	if resolved, err := filepath.EvalSymlinks(exe); err == nil {
		exe = resolved
	}

	return filepath.Join(filepath.Dir(exe), dir)
}

func (p *ThemeProvider) ExternalDir() string {
	return p.externalDir
}
