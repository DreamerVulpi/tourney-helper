package startgg

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"log"
	"os"
	"path/filepath"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	widget "github.com/dreamervulpi/tourney-helper/internal/widget"
)

//go:embed template.html bracketLayout.js startgg.css
var templateFS embed.FS

const StartGGThemeName = "startgg"
const StartGGThemeFileName = "startgg.css"

type StartGGRenderer struct {
	template      *template.Template
	themeProvider *widget.ThemeProvider
}

func NewStartGGRenderer() *StartGGRenderer {
	return NewStartGGRendererWithThemes("")
}

// NewStartGGRendererWithThemes создаёт рендерер с кастомной директорией тем.
// Если themesDir пустой — используется widget.DefaultThemesDir.
func NewStartGGRendererWithThemes(themesDir string) *StartGGRenderer {
	tmpl := template.Must(
		template.ParseFS(templateFS, "template.html", "bracketLayout.js"),
	)

	tp := widget.NewThemeProvider(themesDir)
	ensureStartGGTheme(tp)

	return &StartGGRenderer{
		template:      tmpl,
		themeProvider: tp,
	}
}

func NewStartGGRendererWithThemeProvider(tp *widget.ThemeProvider) *StartGGRenderer {
	tmpl := template.Must(
		template.ParseFS(templateFS, "template.html", "bracketLayout.js"),
	)

	ensureStartGGTheme(tp)
	if css, err := tp.GetThemeCSS(StartGGThemeName); err != nil {
		log.Printf("[startgg] STILL not found after restore: %v", err)
	} else {
		log.Printf("[startgg] ok, css len = %d", len(css))
	}

	return &StartGGRenderer{
		template:      tmpl,
		themeProvider: tp,
	}
}

func (r *StartGGRenderer) Render(bracket *entity.Bracket) (string, error) {
	return r.RenderWithTheme(bracket, widget.DefaultThemeName)
}

// ============================================================
// BuildView — публичный метод, возвращает BracketView без HTML.
//
// Используется:
//   - RenderWithTheme — для рендера HTML
//   - BracketService.GetBracketView — для JSON-ответа
//     (endpoint /widget/bracket/:id/data, auto-refresh)
//
// ============================================================
func (r *StartGGRenderer) BuildView(bracket *entity.Bracket, themeName string) (*entity.BracketView, error) {
	themeCSS, err := r.themeProvider.GetThemeCSS(themeName)
	if err != nil {
		themeCSS, err = r.themeProvider.GetThemeCSS(widget.DefaultThemeName)
		if err != nil {
			return nil, fmt.Errorf("load default theme: %w", err)
		}
	}

	view := r.buildView(bracket)
	view.SystemCSS = template.CSS(widget.SystemCSS)
	view.ThemeCSS = template.CSS(themeCSS)

	return &view, nil
}

func (r *StartGGRenderer) RenderWithTheme(bracket *entity.Bracket, themeName string) (string, error) {
	themeCSS, err := r.themeProvider.GetThemeCSS(themeName)
	if err != nil {
		themeCSS, err = r.themeProvider.GetThemeCSS(widget.DefaultThemeName)
		if err != nil {
			return "", fmt.Errorf("load default theme: %w", err)
		}
	}

	view := r.buildView(bracket)
	view.SystemCSS = template.CSS(widget.SystemCSS)
	view.ThemeCSS = template.CSS(themeCSS)

	var buf bytes.Buffer
	if err := r.template.ExecuteTemplate(&buf, "template.html", view); err != nil {
		return "", fmt.Errorf("execute template: %w", err)
	}

	return buf.String(), nil
}

func (r *StartGGRenderer) ListThemes() ([]string, error) {
	return r.themeProvider.ListThemes()
}

// сheck for the presence of the startgg.css file
func ensureStartGGTheme(tp *widget.ThemeProvider) {
	logger.Log(entityLogger.Debug, "[startgg] ensureStartGGTheme, launched")
	if _, err := tp.GetThemeCSS(StartGGThemeName); err == nil {
		logger.Log(entityLogger.Debug, "[startgg] theme exists, skip")
		return
	} else {
		log.Printf("[startgg] GetThemeCSS(%q) failed: %v", StartGGThemeName, err)
	}

	themesDir := tp.ExternalDir()
	logger.Log(entityLogger.Debug, fmt.Sprintf("[startgg] ensure called: tp=%p dir=%q", tp, tp.ExternalDir()))

	logger.Log(entityLogger.Debug, fmt.Sprintf("[startgg] ExternalDir = %q", themesDir))

	if err := os.MkdirAll(themesDir, 0o755); err != nil {
		logger.Log(entityLogger.Debug, fmt.Sprintf("[startgg] MkdirAll failed: %v", err))
		return
	}

	data, err := templateFS.ReadFile(StartGGThemeFileName)
	if err != nil {
		logger.Log(entityLogger.Debug, fmt.Sprintf("[startgg] embed ReadFile(%q) failed: %v", StartGGThemeFileName, err))
		return
	}
	logger.Log(entityLogger.Debug, fmt.Sprintf("[startgg] embedded size = %d bytes", len(data)))

	path := filepath.Join(themesDir, StartGGThemeFileName)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		log.Printf("[startgg] WriteFile(%q) failed: %v", path, err)
		return
	}
	logger.Log(entityLogger.Debug, fmt.Sprintf("[startgg] restored %q", path))
}
