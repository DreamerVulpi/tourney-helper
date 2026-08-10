package update

import (
	"context"
	"os"
	"strings"

	"path/filepath"

	"fmt"

	"runtime"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/update"
	"github.com/dreamervulpi/tourney-helper/internal/version"
)

type Manager struct {
	Provider   entity.Provider
	Downloader entity.Downloader
	Installer  entity.Installer
	Launcher   entity.Launcher
}

func NewManager(
	provider entity.Provider,
	downloader entity.Downloader,
	installer entity.Installer,
	launcher entity.Launcher,
) *Manager {
	return &Manager{
		Provider:   provider,
		Downloader: downloader,
		Installer:  installer,
		Launcher:   launcher,
	}
}

func (m *Manager) Install(
	ctx context.Context,
	pid int,
	currentDir string,
	exeName string,
	quit func(),
	progress func(downloaded, total int64),
	status func(string)) error {
	reportStatus := func(value string) {
		if status != nil {
			status(value)
		}
	}

	release, err := m.Provider.GetLatestRelease(ctx)
	if err != nil {
		return err
	}
	if release.Version == version.Current {
		return entity.ErrUpToDate
	}

	platform := entity.Platform(runtime.GOOS)
	asset, err := FindAsset(release, platform)
	if err != nil {
		return err
	}

	tempDir, err := os.MkdirTemp("", "tourney-helper-update-*")
	if err != nil {
		return err
	}

	success := false
	defer func() {
		if !success {
			_ = os.RemoveAll(tempDir)
		}
	}()

	zipPath := filepath.Join(tempDir, asset.Name)
	err = m.Downloader.Download(ctx, *asset, zipPath, progress)
	if err != nil {
		return err
	}

	reportStatus("extracting")

	extractDir := filepath.Join(tempDir, "files")
	err = m.Installer.Extract(zipPath, extractDir)
	if err != nil {
		return err
	}

	reportStatus("installing")

	updaterPath := filepath.Join(currentDir, updaterName())
	err = m.Launcher.Start(updaterPath, pid, extractDir, currentDir, exeName)
	if err != nil {
		return err
	}

	success = true
	reportStatus("restarting")
	quit()
	return nil
}

func updaterName() string {
	switch runtime.GOOS {
	case "windows":
		return "updater.exe"
	default:
		return "updater"
	}
}

func FindAsset(release *entity.ReleaseInfo, platform entity.Platform) (*entity.Asset, error) {
	for _, asset := range release.Assets {
		name := strings.ToLower(asset.Name)

		switch platform {
		case entity.PlatformWindows:
			if (strings.Contains(name, "windows") || strings.Contains(name, "-win-")) && strings.HasSuffix(name, ".zip") {
				return &asset, nil
			}
		case entity.PlatformLinux:
			if strings.Contains(name, "linux") && (strings.HasSuffix(name, ".tar.gz") || strings.HasSuffix(name, ".tgz")) {
				return &asset, nil
			}

		case entity.PlatformMacOS:
			if strings.Contains(name, "macos") || strings.Contains(name, "darwin") {
				return &asset, nil
			}
		}
	}

	return nil, fmt.Errorf("%w: %s", entity.ErrNoAsset, platform)
}
