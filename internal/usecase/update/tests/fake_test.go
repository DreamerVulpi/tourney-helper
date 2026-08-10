package update_test

import (
	"context"

	"os"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/update"
)

type fakeProvider struct {
	release *entity.ReleaseInfo
	err     error
}

type fakeDownloader struct {
	err error
}

type fakeInstaller struct {
	err error
}

type fakeLauncher struct {
	err error
}

func (f fakeProvider) GetLatestRelease(ctx context.Context) (*entity.ReleaseInfo, error) {
	return f.release, f.err
}

func (f fakeDownloader) Download(ctx context.Context, asset entity.Asset, dst string, progress func(int64, int64)) error {
	if f.err != nil {
		return f.err
	}

	return os.WriteFile(dst, []byte("fake"), 0644)
}

func (f fakeInstaller) Extract(zip, dst string) error {
	if f.err != nil {
		return f.err
	}

	return os.MkdirAll(dst, 0755)
}

func (f fakeLauncher) Start(updater string, pid int, source string, target string, exe string) error {
	return f.err
}
