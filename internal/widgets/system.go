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

//go:embed themes/bracket/*.css themes/scoreboard/*.css
var builtinThemes embed.FS

const (
	DefaultThemeName = "default"

	BracketThemeKind    = "bracket"
	ScoreboardThemeKind = "scoreboard"

	// DefaultThemesDir — path to custom bracket themes (near binary).
	DefaultThemesDir = "widgets/bracket/themes"
	// DefaultScoreboardThemesDir — path to custom scoreboard themes (near binary).
	DefaultScoreboardThemesDir = "widgets/scoreboard/themes"
)

// ThemeProvider access to CSS themes
type ThemeProvider struct {
	externalDir string
	kind        string
}

// NewThemeProvider creates a provider for bracket themes.
// If externalDir is empty — using DefaultThemesDir.
func NewThemeProvider(externalDir string) *ThemeProvider {
	return newThemeProvider(externalDir, BracketThemeKind, DefaultThemesDir)
}

// NewScoreboardThemeProvider creates a provider for scoreboard themes.
// If externalDir is empty — using DefaultScoreboardThemesDir.
func NewScoreboardThemeProvider(externalDir string) *ThemeProvider {
	return newThemeProvider(externalDir, ScoreboardThemeKind, DefaultScoreboardThemesDir)
}

func newThemeProvider(externalDir, kind, defaultDir string) *ThemeProvider {
	if externalDir == "" {
		externalDir = defaultDir
	}

	externalDir = resolveThemesDir(externalDir)

	return &ThemeProvider{
		externalDir: externalDir,
		kind:        kind,
	}
}

func (p *ThemeProvider) builtinDir() string {
	return "themes/" + p.kind
}

func (p *ThemeProvider) Kind() string {
	return p.kind
}

// ListThemes gaves list names themes (without format .css).
func (p *ThemeProvider) ListThemes() ([]string, error) {
	themes := make(map[string]struct{})

	// Internal themes
	builtinDir := p.builtinDir()
	entries, err := builtinThemes.ReadDir(builtinDir)
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

	// Scoreboard default theme is embedded-only: external file must not override it.
	embeddedOnly := p.kind == ScoreboardThemeKind && name == DefaultThemeName
	if !embeddedOnly {
		filename := filepath.Join(p.externalDir, name+".css")
		if data, err := os.ReadFile(filename); err == nil {
			return string(data), nil
		} else if !os.IsNotExist(err) {
			return "", fmt.Errorf("read external theme %q: %w", name, err)
		}
	}

	builtinPath := fmt.Sprintf("%s/%s.css", p.builtinDir(), name)
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
