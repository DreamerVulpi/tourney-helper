package application

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	widgeticons "github.com/dreamervulpi/tourney-helper/internal/widgets/icons"
)

const maxIconSize = 25 << 20 // 25 MB

func (a *App) GetListIcons() ([]widgeticons.Info, error) {
	return widgeticons.List()
}

func (a *App) DownloadIconFromURL(rawURL string) (widgeticons.Info, error) {
	rawURL = strings.TrimSpace(rawURL)
	logger.Log(entityLogger.Info, "Downloading icon: "+rawURL)

	if rawURL == "" {
		err := fmt.Errorf("icon URL is empty")
		logger.Log(entityLogger.Warning, err.Error())
		return widgeticons.Info{}, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(rawURL)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon download failed: %v", err))
		return widgeticons.Info{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		err := fmt.Errorf("icon download failed with status %s", resp.Status)
		logger.Log(entityLogger.Warning, err.Error())
		return widgeticons.Info{}, err
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxIconSize+1))
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon download read failed: %v", err))
		return widgeticons.Info{}, err
	}
	if len(data) > maxIconSize {
		err := fmt.Errorf("icon is too large (max %d MB)", maxIconSize>>20)
		logger.Log(entityLogger.Warning, err.Error())
		return widgeticons.Info{}, err
	}

	sourceName := "icon"
	if parsed, err := url.Parse(rawURL); err == nil {
		if base := path.Base(parsed.Path); base != "" && base != "." && base != "/" {
			sourceName = base
		}
	}

	return a.saveIconData(data, sourceName, rawURL, true)
}

func (a *App) ImportIconFile(srcPath string) (widgeticons.Info, error) {
	srcPath = strings.TrimSpace(srcPath)
	logger.Log(entityLogger.Info, "Importing icon file: "+srcPath)

	if srcPath == "" {
		err := fmt.Errorf("icon file path is empty")
		logger.Log(entityLogger.Warning, err.Error())
		return widgeticons.Info{}, err
	}

	data, err := os.ReadFile(srcPath)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon file read failed: %v", err))
		return widgeticons.Info{}, err
	}

	return a.saveIconData(data, filepath.Base(srcPath), srcPath, false)
}

func (a *App) saveIconData(data []byte, sourceName, sourceLabel string, download bool) (widgeticons.Info, error) {
	ext, err := iconExtension(data, sourceName)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon save failed for %q: %v", sourceLabel, err))
		return widgeticons.Info{}, err
	}

	dir := widgeticons.Dir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Create icons dir failed: %v", err))
		return widgeticons.Info{}, err
	}

	var name string
	if download {
		name, err = nextDownloadIconName(dir, ext)
	} else {
		base := strings.TrimSuffix(filepath.Base(sourceName), filepath.Ext(sourceName))
		base = sanitizeIconBase(base)
		name, err = uniqueIconName(dir, base, ext)
	}
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon filename failed: %v", err))
		return widgeticons.Info{}, err
	}

	if err := os.WriteFile(filepath.Join(dir, name), data, 0o644); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon write failed: %v", err))
		return widgeticons.Info{}, err
	}

	logger.Log(entityLogger.Success, fmt.Sprintf("Icon saved: %s", name))
	return widgeticons.NewInfo(name, data), nil
}

func (a *App) DeleteIcon(name string) error {
	name = strings.TrimSpace(name)
	logger.Log(entityLogger.Info, "Deleting icon: "+name)

	path, err := widgeticons.Path(name)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon delete failed: %v", err))
		return err
	}

	if err := os.Remove(path); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon delete failed: %v", err))
		return err
	}

	logger.Log(entityLogger.Success, "Icon deleted: "+name)
	return nil
}

func (a *App) RenameIcon(oldName, newName string) (widgeticons.Info, error) {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)
	logger.Log(entityLogger.Info, fmt.Sprintf("Renaming icon: %s -> %s", oldName, newName))

	oldPath, err := widgeticons.Path(oldName)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon rename failed: %v", err))
		return widgeticons.Info{}, err
	}

	oldExt := filepath.Ext(oldName)
	baseInput := filepath.Base(newName)
	if ext := strings.ToLower(filepath.Ext(baseInput)); widgeticons.IsImageName(ext) {
		baseInput = strings.TrimSuffix(baseInput, filepath.Ext(baseInput))
	}
	base := sanitizeIconBase(baseInput)
	finalName := base + oldExt

	if finalName == oldName {
		data, err := os.ReadFile(oldPath)
		if err != nil {
			logger.Log(entityLogger.Warning, fmt.Sprintf("Icon rename failed: %v", err))
			return widgeticons.Info{}, err
		}
		return widgeticons.NewInfo(oldName, data), nil
	}

	dir := widgeticons.Dir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon rename failed: %v", err))
		return widgeticons.Info{}, err
	}

	newPath := filepath.Join(dir, finalName)
	if _, err := os.Stat(newPath); err == nil {
		err := fmt.Errorf("icon %q already exists", finalName)
		logger.Log(entityLogger.Warning, "Icon rename failed: "+err.Error())
		return widgeticons.Info{}, err
	} else if !os.IsNotExist(err) {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon rename failed: %v", err))
		return widgeticons.Info{}, err
	}

	if err := os.Rename(oldPath, newPath); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon rename failed: %v", err))
		return widgeticons.Info{}, err
	}

	data, err := os.ReadFile(newPath)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Icon rename read failed: %v", err))
		return widgeticons.Info{}, err
	}

	logger.Log(entityLogger.Success, "Icon renamed: "+finalName)
	return widgeticons.NewInfo(finalName, data), nil
}

func nextDownloadIconName(dir, ext string) (string, error) {
	for i := 1; i <= 100000; i++ {
		name := fmt.Sprintf("Download-%d%s", i, ext)
		_, err := os.Stat(filepath.Join(dir, name))
		if os.IsNotExist(err) {
			return name, nil
		}
		if err != nil {
			return "", err
		}
	}
	return "", fmt.Errorf("could not find a free download filename")
}

func iconExtension(data []byte, sourceName string) (string, error) {
	ct := http.DetectContentType(data)
	switch {
	case strings.HasPrefix(ct, "image/png"):
		return ".png", nil
	case strings.HasPrefix(ct, "image/jpeg"):
		return ".jpg", nil
	case strings.HasPrefix(ct, "image/gif"):
		return ".gif", nil
	case strings.HasPrefix(ct, "image/bmp"):
		return ".bmp", nil
	case strings.HasPrefix(ct, "image/webp"):
		return ".webp", nil
	}

	ext := strings.ToLower(filepath.Ext(sourceName))
	if widgeticons.IsImageName(ext) {
		return ext, nil
	}

	return "", fmt.Errorf("unsupported image type: %s", ct)
}

func sanitizeIconBase(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "icon"
	}

	name = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z',
			r >= 'A' && r <= 'Z',
			r >= '0' && r <= '9',
			r == '-',
			r == '_':
			return r
		default:
			return '_'
		}
	}, name)

	name = strings.Trim(name, "._-")
	if name == "" {
		name = "icon"
	}
	if len(name) > 80 {
		name = name[:80]
	}

	return name
}

func uniqueIconName(dir, base, ext string) (string, error) {
	name := base + ext
	for i := 1; i <= 10000; i++ {
		_, err := os.Stat(filepath.Join(dir, name))
		if os.IsNotExist(err) {
			return name, nil
		}
		if err != nil {
			return "", err
		}
		name = fmt.Sprintf("%s_%d%s", base, i, ext)
	}
	return "", fmt.Errorf("could not find a free icon filename")
}
