package update_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"path/filepath"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/update"
	usecase "github.com/dreamervulpi/tourney-helper/internal/usecase/update"
)

func TestDownloader_Progress(t *testing.T) {
	body := []byte("Hello Update!")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
	}))
	defer server.Close()

	var (
		called     bool
		downloaded int64
		total      int64
	)

	progress := func(d, t int64) {
		called = true
		downloaded = d
		total = t
	}

	d := usecase.NewDownloader(nil)

	err := d.Download(
		context.Background(),
		entity.Asset{
			URL: server.URL,
		},
		filepath.Join(t.TempDir(), "update.zip"),
		progress,
	)

	if err != nil {
		t.Fatal(err)
	}

	if !called {
		t.Fatal("progress callback not called")
	}

	if downloaded != total {
		t.Fatalf(
			"expected downloaded=%d total=%d",
			total,
			downloaded,
		)
	}
}
