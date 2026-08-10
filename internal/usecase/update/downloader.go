package update

import (
	"context"
	"io"
	"net/http"

	"fmt"

	"os"

	"path/filepath"

	"github.com/dreamervulpi/tourney-helper/internal/entity/update"
)

type Downloader struct {
	client *http.Client
}

type progressWriter struct {
	total      int64
	downloaded int64
	callback   func(downloaded, total int64)
}

func NewDownloader(client *http.Client) *Downloader {
	if client == nil {
		client = http.DefaultClient
	}

	return &Downloader{
		client: client,
	}
}

func (d *Downloader) Download(ctx context.Context, asset update.Asset, destination string, progress func(downloaded, total int64)) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, asset.URL, nil)
	if err != nil {
		return err
	}

	response, err := d.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("download failed: %s", response.Status)
	}

	if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
		return err
	}

	file, err := os.Create(destination)
	if err != nil {
		return err
	}
	defer func() {
		_ = file.Close()
	}()

	writer := &progressWriter{
		total:    response.ContentLength,
		callback: progress,
	}

	reader := io.TeeReader(response.Body, writer)
	_, err = io.Copy(file, reader)
	if err != nil {
		return err
	}

	return nil
}

func (w *progressWriter) Write(p []byte) (int, error) {
	n := len(p)
	w.downloaded += int64(n)

	if w.callback != nil {
		w.callback(w.downloaded, w.total)
	}

	return n, nil
}
