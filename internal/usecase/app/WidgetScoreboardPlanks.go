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
	widgetplanks "github.com/dreamervulpi/tourney-helper/internal/widgets/planks"
)

const maxPlankSize = 25 << 20 // 25 MB

func (a *App) GetListPlanks() ([]widgetplanks.Info, error) {
	return widgetplanks.List()
}

func (a *App) DownloadPlankFromURL(rawURL string) (widgetplanks.Info, error) {
	rawURL = strings.TrimSpace(rawURL)
	logger.Log(entityLogger.Info, "Downloading plank: "+rawURL)

	if rawURL == "" {
		err := fmt.Errorf("plank URL is empty")
		logger.Log(entityLogger.Warning, err.Error())
		return widgetplanks.Info{}, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(rawURL)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank download failed: %v", err))
		return widgetplanks.Info{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		err := fmt.Errorf("plank download failed with status %s", resp.Status)
		logger.Log(entityLogger.Warning, err.Error())
		return widgetplanks.Info{}, err
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxPlankSize+1))
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank download read failed: %v", err))
		return widgetplanks.Info{}, err
	}
	if len(data) > maxPlankSize {
		err := fmt.Errorf("plank is too large (max %d MB)", maxPlankSize>>20)
		logger.Log(entityLogger.Warning, err.Error())
		return widgetplanks.Info{}, err
	}

	sourceName := "plank"
	if parsed, err := url.Parse(rawURL); err == nil {
		if base := path.Base(parsed.Path); base != "" && base != "." && base != "/" {
			sourceName = base
		}
	}

	return a.savePlankData(data, sourceName, rawURL, true)
}

func (a *App) ImportPlankFile(srcPath string) (widgetplanks.Info, error) {
	srcPath = strings.TrimSpace(srcPath)
	logger.Log(entityLogger.Info, "Importing plank file: "+srcPath)

	if srcPath == "" {
		err := fmt.Errorf("plank file path is empty")
		logger.Log(entityLogger.Warning, err.Error())
		return widgetplanks.Info{}, err
	}

	data, err := os.ReadFile(srcPath)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank file read failed: %v", err))
		return widgetplanks.Info{}, err
	}

	return a.savePlankData(data, filepath.Base(srcPath), srcPath, false)
}

func (a *App) savePlankData(data []byte, sourceName, sourceLabel string, download bool) (widgetplanks.Info, error) {
	ext, err := plankExtension(data, sourceName)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank save failed for %q: %v", sourceLabel, err))
		return widgetplanks.Info{}, err
	}

	dir := widgetplanks.Dir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Create planks dir failed: %v", err))
		return widgetplanks.Info{}, err
	}

	var name string
	if download {
		name, err = nextDownloadPlankName(dir, ext)
	} else {
		base := strings.TrimSuffix(filepath.Base(sourceName), filepath.Ext(sourceName))
		base = sanitizePlankBase(base)
		name, err = uniquePlankName(dir, base, ext)
	}
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank filename failed: %v", err))
		return widgetplanks.Info{}, err
	}

	if err := os.WriteFile(filepath.Join(dir, name), data, 0o644); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank write failed: %v", err))
		return widgetplanks.Info{}, err
	}

	logger.Log(entityLogger.Success, fmt.Sprintf("Plank saved: %s", name))
	return widgetplanks.NewInfo(name, data), nil
}

func (a *App) DeletePlank(name string) error {
	name = strings.TrimSpace(name)
	logger.Log(entityLogger.Info, "Deleting plank: "+name)

	path, err := widgetplanks.Path(name)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank delete failed: %v", err))
		return err
	}

	if err := os.Remove(path); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank delete failed: %v", err))
		return err
	}

	logger.Log(entityLogger.Success, "Plank deleted: "+name)
	return nil
}

func (a *App) RenamePlank(oldName, newName string) (widgetplanks.Info, error) {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)
	logger.Log(entityLogger.Info, fmt.Sprintf("Renaming plank: %s -> %s", oldName, newName))

	oldPath, err := widgetplanks.Path(oldName)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank rename failed: %v", err))
		return widgetplanks.Info{}, err
	}

	oldExt := filepath.Ext(oldName)
	baseInput := filepath.Base(newName)
	if ext := strings.ToLower(filepath.Ext(baseInput)); widgetplanks.IsImageName(ext) {
		baseInput = strings.TrimSuffix(baseInput, filepath.Ext(baseInput))
	}
	base := sanitizePlankBase(baseInput)
	finalName := base + oldExt

	if finalName == oldName {
		data, err := os.ReadFile(oldPath)
		if err != nil {
			logger.Log(entityLogger.Warning, fmt.Sprintf("Plank rename failed: %v", err))
			return widgetplanks.Info{}, err
		}
		return widgetplanks.NewInfo(oldName, data), nil
	}

	dir := widgetplanks.Dir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank rename failed: %v", err))
		return widgetplanks.Info{}, err
	}

	newPath := filepath.Join(dir, finalName)
	if _, err := os.Stat(newPath); err == nil {
		err := fmt.Errorf("plank %q already exists", finalName)
		logger.Log(entityLogger.Warning, "Plank rename failed: "+err.Error())
		return widgetplanks.Info{}, err
	} else if !os.IsNotExist(err) {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank rename failed: %v", err))
		return widgetplanks.Info{}, err
	}

	if err := os.Rename(oldPath, newPath); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank rename failed: %v", err))
		return widgetplanks.Info{}, err
	}

	data, err := os.ReadFile(newPath)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Plank rename read failed: %v", err))
		return widgetplanks.Info{}, err
	}

	logger.Log(entityLogger.Success, "Plank renamed: "+finalName)
	return widgetplanks.NewInfo(finalName, data), nil
}

func nextDownloadPlankName(dir, ext string) (string, error) {
	for i := 1; i <= 100000; i++ {
		name := fmt.Sprintf("Plank-%d%s", i, ext)
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

func plankExtension(data []byte, sourceName string) (string, error) {
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
	if widgetplanks.IsImageName(ext) {
		return ext, nil
	}

	return "", fmt.Errorf("unsupported image type: %s", ct)
}

func sanitizePlankBase(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "plank"
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
		name = "plank"
	}
	if len(name) > 80 {
		name = name[:80]
	}

	return name
}

func uniquePlankName(dir, base, ext string) (string, error) {
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
	return "", fmt.Errorf("could not find a free plank filename")
}
