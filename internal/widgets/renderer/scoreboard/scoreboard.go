package scoreboard

import (
	"bytes"
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
	widget "github.com/dreamervulpi/tourney-helper/internal/widgets"
)

//go:embed template.html
var templateFS embed.FS

const StartGGThemeName = "startgg"

// Renderer — рендерер HTML-виджета scoreboard.
type Renderer struct {
	tmpl          *template.Template
	themeProvider *widget.ThemeProvider
}

func NewRenderer(tp *widget.ThemeProvider) *Renderer {
	return &Renderer{
		tmpl:          template.Must(template.ParseFS(templateFS, "template.html")),
		themeProvider: tp,
	}
}

func (r *Renderer) Render(scoreboard config.WidgetScoreboard) (string, error) {
	return r.RenderWithTheme(scoreboard, widget.DefaultThemeName)
}

func (r *Renderer) RenderWithTheme(scoreboard config.WidgetScoreboard, themeName string) (string, error) {
	themeCSS, err := r.themeProvider.GetThemeCSS(themeName)
	if err != nil {
		themeCSS, err = r.themeProvider.GetThemeCSS(widget.DefaultThemeName)
		if err != nil {
			return "", fmt.Errorf("load scoreboard theme: %w", err)
		}
	}

	stateJSON, err := json.Marshal(scoreboard)
	if err != nil {
		return "", fmt.Errorf("marshal scoreboard state: %w", err)
	}

	safeJSON := strings.ReplaceAll(string(stateJSON), "</", "<\\/")

	view := struct {
		ThemeCSS   template.CSS
		StateJSON  template.JS
		Scoreboard config.WidgetScoreboard
	}{
		ThemeCSS:   template.CSS(themeCSS),
		StateJSON:  template.JS(safeJSON),
		Scoreboard: scoreboard,
	}

	var buf bytes.Buffer
	if err := r.tmpl.ExecuteTemplate(&buf, "template.html", view); err != nil {
		return "", fmt.Errorf("execute scoreboard template: %w", err)
	}

	return buf.String(), nil
}

func (r *Renderer) ListThemes() ([]string, error) {
	return r.themeProvider.ListThemes()
}

func (r *Renderer) GetThemeCSS(name string) (string, error) {
	return r.themeProvider.GetThemeCSS(name)
}

// EnsureThemes — создаёт директорию тем scoreboard и выгружает в неё
// встроенные темы default/startgg, если их там ещё нет.
func EnsureThemes(tp *widget.ThemeProvider) error {
	dir := tp.ExternalDir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create scoreboard themes dir %q: %w", dir, err)
	}

	// default.css is embedded-only and must not be exposed as an external file.
	legacyDefault := filepath.Join(dir, widget.DefaultThemeName+".css")
	if err := os.Remove(legacyDefault); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove external default scoreboard theme %q: %w", legacyDefault, err)
	}

	// startgg.css is an external theme and is restored if missing/deleted.
	dst := filepath.Join(dir, StartGGThemeName+".css")
	if _, err := os.Stat(dst); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("stat scoreboard theme %q: %w", dst, err)
	}

	css, err := tp.GetThemeCSS(StartGGThemeName)
	if err != nil {
		return fmt.Errorf("read scoreboard theme %q: %w", StartGGThemeName, err)
	}
	if err := os.WriteFile(dst, []byte(css), 0o644); err != nil {
		return fmt.Errorf("write scoreboard theme %q: %w", dst, err)
	}

	return nil
}
