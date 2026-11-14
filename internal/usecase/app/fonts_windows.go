//go:build windows

package application

import (
	"regexp"
	"sort"
	"strings"

	"golang.org/x/sys/windows/registry"
)

var (
	fontTypeSuffix  = regexp.MustCompile(`\s*\([^)]*\)\s*$`)
	fontStyleSuffix = regexp.MustCompile(`(?i)\s+(Regular|Bold Italic|Bold|Italic|Light|SemiBold|Semibold|Black|Medium|Thin|ExtraLight|ExtraBold|Oblique|Heavy|Book|Roman|UltraLight|Extra Black|Курсив|Полужирный|Жирный|Наклонный|Светлый|Обычный|Средний|Чёрный|Черный|Тонкий)\s*$`)
)

// GetSystemFonts returns installed font family names for the current user.
func (a *App) GetSystemFonts() ([]string, error) {
	names := make(map[string]struct{})

	collect := func(root registry.Key, path string) {
		key, err := registry.OpenKey(root, path, registry.READ)
		if err != nil {
			return
		}
		defer key.Close()

		values, err := key.ReadValueNames(-1)
		if err != nil {
			return
		}

		for _, value := range values {
			family := normalizeFontName(value)
			if family != "" {
				names[family] = struct{}{}
			}
		}
	}

	collect(registry.LOCAL_MACHINE, `SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts`)
	collect(registry.CURRENT_USER, `Software\Microsoft\Windows NT\CurrentVersion\Fonts`)

	result := make([]string, 0, len(names))
	for name := range names {
		result = append(result, name)
	}
	sort.Strings(result)

	if len(result) == 0 {
		result = fallbackFonts()
	}

	return result, nil
}

func normalizeFontName(name string) string {
	name = strings.TrimPrefix(name, "@")
	name = fontTypeSuffix.ReplaceAllString(name, "")

	for {
		next := fontStyleSuffix.ReplaceAllString(name, "")
		if next == name {
			break
		}
		name = next
	}

	return strings.TrimSpace(name)
}
