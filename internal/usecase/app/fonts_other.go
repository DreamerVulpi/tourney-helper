//go:build !windows

package application

// GetSystemFonts returns a small fallback list on non-Windows platforms.
func (a *App) GetSystemFonts() ([]string, error) {
	return fallbackFonts(), nil
}
