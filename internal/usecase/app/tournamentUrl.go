package application

import (
	"fmt"
	"net/url"
	"strings"
)

// Mode — что именно нужно извлечь из URL.
type Mode string

const (
	ModeSlug   Mode = "slug"   // slug турнира (для рассылки)
	ModeWidget Mode = "widget" // ID турнирной сетки (для виджета)
)

// ParseTournamentURL — единая точка парсинга URL турнира.
//
// В зависимости от mode:
//   - ModeSlug   → возвращает slug (для рассылки)
//   - ModeWidget → возвращает ID сетки (для виджета)
func (a *App) ParseTournamentURL(platform string, rawURL string, mode Mode) (string, error) {
	if len(rawURL) == 0 {
		return "", fmt.Errorf("No URL provided")
	}

	rawURL = strings.TrimSpace(rawURL)

	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("Error parsing the URL: %v", err)
	}

	parts := splitPath(u.Path)

	switch strings.ToLower(platform) {
	case "startgg":
		return parseStartGG(u, parts, mode)

	case "challonge":
		return parseChallonge(u, parts, mode)

	default:
		return "", fmt.Errorf("Unsupported tournament platform: %s", platform)
	}
}

func (a *App) ParseTournamentURLForWidget(platform, rawURL string) (string, error) {
	return a.ParseTournamentURL(platform, rawURL, ModeWidget)
}

func (a *App) ParseTournamentURLForNotification(platform, rawURL string) (string, error) {
	return a.ParseTournamentURL(platform, rawURL, ModeSlug)
}

// splitPath разбивает путь по "/" и убирает пустые сегменты.
func splitPath(p string) []string {
	raw := strings.Split(p, "/")
	out := make([]string, 0, len(raw))
	for _, part := range raw {
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

// isNumeric возвращает true, если строка состоит только из цифр.
func isNumeric(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func parseStartGG(u *url.URL, parts []string, mode Mode) (string, error) {
	if !strings.Contains(u.Host, "start.gg") {
		return "", fmt.Errorf("Url not supported for the platform start.gg")
	}

	switch mode {
	case ModeWidget:
		// Ищем "brackets" и берём следующий за ним сегмент.
		//
		// URL:  /tournament/<slug>/event/<event>/brackets/<phaseId>/<groupId>
		//                                                            ↑
		//                                            берём именно <groupId>
		//
		// Пример: .../brackets/2322695/3359632 → 3359632
		bracketsIdx := -1
		for i, part := range parts {
			if part == "brackets" {
				bracketsIdx = i
				break
			}
		}

		if bracketsIdx == -1 || bracketsIdx+1 >= len(parts) {
			return "", fmt.Errorf("Invalid URL for start.gg: missing 'brackets/<id>'")
		}

		// Если после brackets идёт ещё один числовой сегмент — берём его.
		// Иначе — берём первый числовой после brackets.
		if bracketsIdx+2 < len(parts) && isNumeric(parts[bracketsIdx+2]) {
			return parts[bracketsIdx+2], nil
		}

		if isNumeric(parts[bracketsIdx+1]) {
			return parts[bracketsIdx+1], nil
		}

		return "", fmt.Errorf("Invalid URL for start.gg: invalid ID after 'brackets'")

	case ModeSlug:
		fallthrough
	default:
		// Старое поведение — slug.
		tournamentIdx := -1
		eventIdx := -1

		for i, part := range parts {
			if part == "tournament" {
				tournamentIdx = i
			}
			if part == "event" {
				eventIdx = i
			}
		}

		if tournamentIdx != -1 && eventIdx != -1 &&
			tournamentIdx+1 < len(parts) && eventIdx+1 < len(parts) {
			slug := fmt.Sprintf("tournament/%s/event/%s",
				parts[tournamentIdx+1], parts[eventIdx+1])
			return slug, nil
		}

		return "", fmt.Errorf("Invalid URL for start.gg. Expected format: .../tournament/NAME/event/NAME")
	}
}

func parseChallonge(u *url.URL, parts []string, mode Mode) (string, error) {
	if !strings.Contains(u.Host, "challonge.com") {
		return "", fmt.Errorf("URL not supported for the platform challonge.com")
	}

	if len(parts) == 0 {
		return "", fmt.Errorf("No URL provided")
	}

	knownLocales := map[string]bool{
		"ru": true, "en": true, "es": true, "fr": true, "de": true,
		"ja": true, "ko": true, "zh": true, "pt": true, "it": true,
	}

	// Определяем, начинается ли путь с локали
	var tourneySlug string
	if len(parts) >= 2 && knownLocales[strings.ToLower(parts[0])] {
		tourneySlug = parts[1]
	} else {
		tourneySlug = parts[0]
	}

	if len(tourneySlug) == 0 {
		return "", fmt.Errorf("Unable to extract the slug")
	}

	// Challonge использует slug в обоих режимах.
	// Если позже понадобится отдельный ID — расширим.
	hostParts := strings.Split(u.Host, ".")
	if len(hostParts) > 2 && hostParts[0] != "www" {
		return fmt.Sprintf("%s-%s", hostParts[0], tourneySlug), nil
	}

	return tourneySlug, nil
}
