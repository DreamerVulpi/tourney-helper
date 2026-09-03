package startgg

import (
	"bytes"
	"embed"
	"html/template"

	"fmt"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
)

//go:embed template.html
var templateFS embed.FS

type StartGGRenderer struct {
	template *template.Template
}

func NewStartGGRenderer() *StartGGRenderer {
	tmpl := template.Must(
		template.ParseFS(templateFS, "template.html"),
	)
	return &StartGGRenderer{
		template: tmpl,
	}
}

func (r *StartGGRenderer) Render(bracket *entity.Bracket) (string, error) {
	view := r.buildView(bracket)

	var buf bytes.Buffer

	if err := r.template.Execute(&buf, view); err != nil {
		return "", fmt.Errorf("execute template: %w", err)
	}

	return buf.String(), nil
}
