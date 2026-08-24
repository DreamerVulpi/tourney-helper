package update_test

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"context"

	"bytes"
	"os"

	"time"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/update"
	usecase "github.com/dreamervulpi/tourney-helper/internal/usecase/update"
)

func TestDownloader_Download_Success(t *testing.T) {
	body := []byte("Hello Update!")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
	}))
	defer server.Close()

	d := usecase.NewDownloader(nil)
	asset := entity.Asset{
		URL: server.URL,
	}

	destination := filepath.Join(
		t.TempDir(),
		"update.zip",
	)

	err := d.Download(
		context.Background(),
		asset,
		destination,
		nil,
	)

	if err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(destination)
	if err != nil {
		t.Fatal(err)
	}

	if !bytes.Equal(data, body) {
		t.Fatalf("expected %q got %q", body, data)
	}
}

func TestDownloader_HTTP_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	d := usecase.NewDownloader(nil)

	err := d.Download(
		context.Background(),
		entity.Asset{
			URL: server.URL,
		},
		filepath.Join(t.TempDir(), "update.zip"),
		nil,
	)

	if err == nil {
		t.Fatal("expected error")
	}
}

func TestDownloader_Context_Cancelled(t *testing.T) {
	body := []byte("Hello Update!")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
	}))
	defer server.Close()

	d := usecase.NewDownloader(nil)
	asset := entity.Asset{
		URL: server.URL,
	}

	destination := filepath.Join(
		t.TempDir(),
		"update.zip",
	)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()
	err := d.Download(
		ctx,
		asset,
		destination,
		nil,
	)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestDownloader_InvalidURL(t *testing.T) {
	d := usecase.NewDownloader(nil)

	err := d.Download(
		context.Background(),
		entity.Asset{
			URL: "://invalid",
		},
		filepath.Join(t.TempDir(), "update.zip"),
		nil,
	)

	if err == nil {
		t.Fatal("expected error")
	}
}
