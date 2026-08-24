package update_test

import (
	"context"
	"testing"

	"errors"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/update"
	usecase "github.com/dreamervulpi/tourney-helper/internal/usecase/update"
	"github.com/dreamervulpi/tourney-helper/internal/version"
)

func testRelease() *entity.ReleaseInfo {
	return &entity.ReleaseInfo{
		Version: "v999.0.0",
		Assets: []entity.Asset{
			{
				Name: "TourneyHelper-Windows-x64.zip",
				URL:  "https://example.com/update.zip",
			},
		},
	}
}

func TestManagerInstall(t *testing.T) {
	tests := []struct {
		name string

		provider   entity.Provider
		downloader entity.Downloader
		installer  entity.Installer
		launcher   entity.Launcher

		err error
	}{
		{
			name: "success",

			provider: fakeProvider{
				release: testRelease(),
			},
			downloader: fakeDownloader{},
			installer:  fakeInstaller{},
			launcher:   fakeLauncher{},

			err: nil,
		},
		{
			name: "provider error",

			provider: fakeProvider{
				err: entity.ErrProvider,
			},
			downloader: fakeDownloader{},
			installer:  fakeInstaller{},
			launcher:   fakeLauncher{},

			err: entity.ErrProvider,
		},
		{
			name: "already up to date",

			provider: fakeProvider{
				release: &entity.ReleaseInfo{
					Version: version.Current,
				},
			},
			downloader: fakeDownloader{},
			installer:  fakeInstaller{},
			launcher:   fakeLauncher{},

			err: entity.ErrUpToDate,
		},
		{
			name: "asset not found",

			provider: fakeProvider{
				release: &entity.ReleaseInfo{
					Version: "v999.0.0",
				},
			},
			downloader: fakeDownloader{},
			installer:  fakeInstaller{},
			launcher:   fakeLauncher{},

			err: entity.ErrNoAsset,
		},
		{
			name: "download error",

			provider: fakeProvider{
				release: testRelease(),
			},
			downloader: fakeDownloader{
				err: entity.ErrDownload,
			},
			installer: fakeInstaller{},
			launcher:  fakeLauncher{},

			err: entity.ErrDownload,
		},
		{
			name: "extract error",

			provider: fakeProvider{
				release: testRelease(),
			},
			downloader: fakeDownloader{},
			installer: fakeInstaller{
				err: entity.ErrExtract,
			},
			launcher: fakeLauncher{},

			err: entity.ErrExtract,
		},
		{
			name: "launcher error",

			provider: fakeProvider{
				release: testRelease(),
			},
			downloader: fakeDownloader{},
			installer:  fakeInstaller{},
			launcher: fakeLauncher{
				err: entity.ErrLauncher,
			},

			err: entity.ErrLauncher,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			manager := usecase.NewManager(
				tt.provider,
				tt.downloader,
				tt.installer,
				tt.launcher,
			)
			err := manager.Install(
				context.Background(),
				123,
				t.TempDir(),
				"TourneyHelper.exe",
				func() {},
				nil,
				nil,
			)
			switch {
			case tt.err == nil && err != nil:
				t.Fatalf("unexpected error: %v", err)

			case tt.err != nil && !errors.Is(err, tt.err):
				t.Fatalf("expected %v got %v", tt.err, err)
			}
		})
	}

}

func TestFindAsset(t *testing.T) {
	tests := []struct {
		name     string
		platform entity.Platform
		release  *entity.ReleaseInfo
		wantName string
		wantErr  bool
	}{
		{
			name:     "windows asset",
			platform: entity.PlatformWindows,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TourneyHelper-Windows-x64.zip"},
				},
			},
			wantName: "TourneyHelper-Windows-x64.zip",
		},
		{
			name:     "linux tar.gz",
			platform: entity.PlatformLinux,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TourneyHelper-Linux-x64.tar.gz"},
				},
			},
			wantName: "TourneyHelper-Linux-x64.tar.gz",
		},
		{
			name:     "linux tgz",
			platform: entity.PlatformLinux,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TourneyHelper-Linux-x64.tgz"},
				},
			},
			wantName: "TourneyHelper-Linux-x64.tgz",
		},
		{
			name:     "macos asset",
			platform: entity.PlatformMacOS,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TourneyHelper-macOS-arm64.zip"},
				},
			},
			wantName: "TourneyHelper-macOS-arm64.zip",
		},
		{
			name:     "darwin asset",
			platform: entity.PlatformMacOS,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TourneyHelper-darwin-arm64.zip"},
				},
			},
			wantName: "TourneyHelper-darwin-arm64.zip",
		},
		{
			name:     "asset not found",
			platform: entity.PlatformWindows,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TourneyHelper-Linux.tar.gz"},
				},
			},
			wantErr: true,
		},
		{
			name:     "windows upper case",
			platform: entity.PlatformWindows,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TOURNEYHELPER-WINDOWS-X64.ZIP"},
				},
			},
			wantName: "TOURNEYHELPER-WINDOWS-X64.ZIP",
		},
		{
			name:     "choose correct asset",
			platform: entity.PlatformWindows,
			release: &entity.ReleaseInfo{
				Assets: []entity.Asset{
					{Name: "TourneyHelper-Linux.tar.gz"},
					{Name: "TourneyHelper-macOS.zip"},
					{Name: "TourneyHelper-Windows.zip"},
				},
			},
			wantName: "TourneyHelper-Windows.zip",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			asset, err := usecase.FindAsset(tt.release, tt.platform)

			if (err != nil) != tt.wantErr {
				t.Fatalf("expected error=%v got=%v", tt.wantErr, err)
			}

			if tt.wantErr {
				return
			}

			if asset == nil {
				t.Fatal("expected asset, got nil")
			}

			if asset.Name != tt.wantName {
				t.Fatalf("expected %q got %q", tt.wantName, asset.Name)
			}
		})
	}
}
