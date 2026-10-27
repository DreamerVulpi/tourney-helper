package validator

import (
	"net/url"
	"regexp"
	"strings"
)

// StartGGPlatform — реализация Platform для start.gg.
type StartGGPlatform struct{}

func NewStartGGPlatform() *StartGGPlatform {
	return &StartGGPlatform{}
}

func (p *StartGGPlatform) Name() string {
	return "startgg"
}

// startGGHosts — список хостов, на которых может лежать start.gg.
var startGGHosts = []string{
	"start.gg",
	"www.start.gg",
}

// startGGPathRe — регулярное выражение для пути турнирной сетки start.gg.
//
// Пример валидного пути:
//
//	/tournament/moscow-slam-2026/event/tekken-8/brackets/2322695/3359632
//
// Структура:
//
//	/tournament/<slug>/event/<event-slug>/brackets/<phase-id>/<group-id>
var startGGPathRe = regexp.MustCompile(
	`^/tournament/[^/]+/event/[^/]+/brackets/\d+/\d+/?$`,
)

func (p *StartGGPlatform) Match(rawURL string) bool {
	u, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	host := strings.ToLower(u.Host)
	for _, h := range startGGHosts {
		if host == h {
			return true
		}
	}

	return false
}

func (p *StartGGPlatform) Validate(rawURL string) bool {
	u, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	// Хост должен быть start.gg
	if !p.Match(rawURL) {
		return false
	}

	// Путь должен совпадать с шаблоном
	if !startGGPathRe.MatchString(u.Path) {
		return false
	}

	return true
}
