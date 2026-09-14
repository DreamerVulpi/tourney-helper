package startgg

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
	widget "github.com/dreamervulpi/tourney-helper/internal/widget"
)

//go:embed template.html bracketLayout.js
var templateFS embed.FS

type StartGGRenderer struct {
	template      *template.Template
	themeProvider *widget.ThemeProvider
}

// NewStartGGRenderer создаёт рендерер с дефолтной директорией тем (widget/themes).
func NewStartGGRenderer() *StartGGRenderer {
	return NewStartGGRendererWithThemes("")
}

// NewStartGGRendererWithThemes создаёт рендерер с кастомной директорией тем.
// Если themesDir пустой — используется widget.DefaultThemesDir.
func NewStartGGRendererWithThemes(themesDir string) *StartGGRenderer {
	tmpl := template.Must(
		template.ParseFS(templateFS, "template.html", "bracketLayout.js"),
	)

	return &StartGGRenderer{
		template:      tmpl,
		themeProvider: widget.NewThemeProvider(themesDir),
	}
}

func NewStartGGRendererWithThemeProvider(tp *widget.ThemeProvider) *StartGGRenderer {
	tmpl := template.Must(
		template.ParseFS(templateFS, "template.html", "bracketLayout.js"),
	)
	return &StartGGRenderer{
		template:      tmpl,
		themeProvider: tp,
	}
}

// Render реализует BracketRenderer — использует тему по умолчанию.
func (r *StartGGRenderer) Render(bracket *entity.Bracket) (string, error) {
	return r.RenderWithTheme(bracket, widget.DefaultThemeName)
}

// RenderWithTheme рендерит с указанной темой.
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

// ListThemes возвращает список доступных тем.
func (r *StartGGRenderer) ListThemes() ([]string, error) {
	return r.themeProvider.ListThemes()
}
