package db

import (
	"database/sql"

	"fmt"

	"os"
	"path/filepath"

	"embed"

	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var embedMigrations embed.FS

func getAbsPath(fileName string) string {
	ex, err := os.Executable()
	if err != nil {
		return fileName
	}

	// folder
	exPath := filepath.Dir(ex)

	if strings.Contains(exPath, "Temp") || strings.Contains(exPath, "go-build") {
		return fileName
	}
	return filepath.Join(exPath, fileName)
}

func NewPool(activeProfile string) (*sql.DB, error) {
	path := getAbsPath(filepath.Join("profiles", activeProfile, fmt.Sprintf("%v.db", config.ProfileDbFileName)))
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("sqlite | failed to create profile dir: %w", err)
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("sqlite | failed to open db: %w", err)
	}
	_, err = db.Exec(`
		PRAGMA foreign_keys = ON;
		PRAGMA journal_mode = WAL;
		PRAGMA busy_timeout = 5000;
	`)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite | database unreachable: %w", err)
	}

	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("sqlite3"); err != nil {
		return nil, fmt.Errorf("sqlite | failed to set dialect: %w", err)
	}

	if err := goose.Up(db, "migrations"); err != nil {
		return nil, fmt.Errorf("sqlite | migration failed: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)
	return db, nil
}
