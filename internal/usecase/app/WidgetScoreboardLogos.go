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
	widgetlogos "github.com/dreamervulpi/tourney-helper/internal/widgets/logos"
)

const maxLogoSize = 25 << 20 // 25 MB

func (a *App) GetListLogos() ([]widgetlogos.Info, error) {
	return widgetlogos.List()
}

func (a *App) DownloadLogoFromURL(rawURL string) (widgetlogos.Info, error) {
	rawURL = strings.TrimSpace(rawURL)
	logger.Log(entityLogger.Info, "Downloading logo: "+rawURL)

	if rawURL == "" {
		err := fmt.Errorf("logo URL is empty")
		logger.Log(entityLogger.Warning, err.Error())
		return widgetlogos.Info{}, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(rawURL)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo download failed: %v", err))
		return widgetlogos.Info{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		err := fmt.Errorf("logo download failed with status %s", resp.Status)
		logger.Log(entityLogger.Warning, err.Error())
		return widgetlogos.Info{}, err
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxLogoSize+1))
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo download read failed: %v", err))
		return widgetlogos.Info{}, err
	}
	if len(data) > maxLogoSize {
		err := fmt.Errorf("logo is too large (max %d MB)", maxLogoSize>>20)
		logger.Log(entityLogger.Warning, err.Error())
		return widgetlogos.Info{}, err
	}

	sourceName := "logo"
	if parsed, err := url.Parse(rawURL); err == nil {
		if base := path.Base(parsed.Path); base != "" && base != "." && base != "/" {
			sourceName = base
		}
	}

	return a.saveLogoData(data, sourceName, rawURL, true)
}

func (a *App) ImportLogoFile(srcPath string) (widgetlogos.Info, error) {
	srcPath = strings.TrimSpace(srcPath)
	logger.Log(entityLogger.Info, "Importing logo file: "+srcPath)

	if srcPath == "" {
		err := fmt.Errorf("logo file path is empty")
		logger.Log(entityLogger.Warning, err.Error())
		return widgetlogos.Info{}, err
	}

	data, err := os.ReadFile(srcPath)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo file read failed: %v", err))
		return widgetlogos.Info{}, err
	}

	return a.saveLogoData(data, filepath.Base(srcPath), srcPath, false)
}

func (a *App) saveLogoData(data []byte, sourceName, sourceLabel string, download bool) (widgetlogos.Info, error) {
	ext, err := logoExtension(data, sourceName)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo save failed for %q: %v", sourceLabel, err))
		return widgetlogos.Info{}, err
	}

	dir := widgetlogos.Dir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Create logos dir failed: %v", err))
		return widgetlogos.Info{}, err
	}

	var name string
	if download {
		name, err = nextDownloadLogoName(dir, ext)
	} else {
		base := strings.TrimSuffix(filepath.Base(sourceName), filepath.Ext(sourceName))
		base = sanitizeLogoBase(base)
		name, err = uniqueLogoName(dir, base, ext)
	}
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo filename failed: %v", err))
		return widgetlogos.Info{}, err
	}

	if err := os.WriteFile(filepath.Join(dir, name), data, 0o644); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo write failed: %v", err))
		return widgetlogos.Info{}, err
	}

	logger.Log(entityLogger.Success, fmt.Sprintf("Logo saved: %s", name))
	return widgetlogos.NewInfo(name, data), nil
}

func (a *App) DeleteLogo(name string) error {
	name = strings.TrimSpace(name)
	logger.Log(entityLogger.Info, "Deleting logo: "+name)

	path, err := widgetlogos.Path(name)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo delete failed: %v", err))
		return err
	}

	if err := os.Remove(path); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo delete failed: %v", err))
		return err
	}

	logger.Log(entityLogger.Success, "Logo deleted: "+name)
	return nil
}

func (a *App) RenameLogo(oldName, newName string) (widgetlogos.Info, error) {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)
	logger.Log(entityLogger.Info, fmt.Sprintf("Renaming logo: %s -> %s", oldName, newName))

	oldPath, err := widgetlogos.Path(oldName)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo rename failed: %v", err))
		return widgetlogos.Info{}, err
	}

	oldExt := filepath.Ext(oldName)
	baseInput := filepath.Base(newName)
	if ext := strings.ToLower(filepath.Ext(baseInput)); widgetlogos.IsImageName(ext) {
		baseInput = strings.TrimSuffix(baseInput, filepath.Ext(baseInput))
	}
	base := sanitizeLogoBase(baseInput)
	finalName := base + oldExt

	if finalName == oldName {
		data, err := os.ReadFile(oldPath)
		if err != nil {
			logger.Log(entityLogger.Warning, fmt.Sprintf("Logo rename failed: %v", err))
			return widgetlogos.Info{}, err
		}
		return widgetlogos.NewInfo(oldName, data), nil
	}

	dir := widgetlogos.Dir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo rename failed: %v", err))
		return widgetlogos.Info{}, err
	}

	newPath := filepath.Join(dir, finalName)
	if _, err := os.Stat(newPath); err == nil {
		err := fmt.Errorf("logo %q already exists", finalName)
		logger.Log(entityLogger.Warning, "Logo rename failed: "+err.Error())
		return widgetlogos.Info{}, err
	} else if !os.IsNotExist(err) {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo rename failed: %v", err))
		return widgetlogos.Info{}, err
	}

	if err := os.Rename(oldPath, newPath); err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo rename failed: %v", err))
		return widgetlogos.Info{}, err
	}

	data, err := os.ReadFile(newPath)
	if err != nil {
		logger.Log(entityLogger.Warning, fmt.Sprintf("Logo rename read failed: %v", err))
		return widgetlogos.Info{}, err
	}

	logger.Log(entityLogger.Success, "Logo renamed: "+finalName)
	return widgetlogos.NewInfo(finalName, data), nil
}

func nextDownloadLogoName(dir, ext string) (string, error) {
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

func logoExtension(data []byte, sourceName string) (string, error) {
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
	if widgetlogos.IsImageName(ext) {
		return ext, nil
	}

	return "", fmt.Errorf("unsupported image type: %s", ct)
}

func sanitizeLogoBase(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "logo"
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
		name = "logo"
	}
	if len(name) > 80 {
		name = name[:80]
	}

	return name
}

func uniqueLogoName(dir, base, ext string) (string, error) {
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
	return "", fmt.Errorf("could not find a free logo filename")
}
