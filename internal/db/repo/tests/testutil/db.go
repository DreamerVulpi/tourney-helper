package testutil

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/pressly/goose/v3"

	"runtime"

	_ "modernc.org/sqlite"
)

func NewTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open(
		"sqlite",
		":memory:",
	)
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}

	t.Cleanup(func() {
		db.Close()
	})

	if err := applyMigrations(db); err != nil {
		t.Fatalf("failed to apply migrations: %v", err)
	}

	return db
}

func applyMigrations(db *sql.DB) error {
	goose.SetDialect("sqlite3")

	return goose.Up(
		db,
		migrationsPath(),
	)
}

func migrationsPath() string {
	_, filename, _, _ := runtime.Caller(0)

	root := filepath.Dir(filename)

	path := filepath.Join(
		root,
		"../../../migrations",
	)

	return path
}
