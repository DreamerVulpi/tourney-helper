package db

import (
	"database/sql"

	"fmt"

	"os"
	"path/filepath"

	"embed"

	"strings"

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

func isGoRun(path string) bool {
	// Простая проверка, не находимся ли мы во временной папке компиляции Go
	return filepath.Base(filepath.Dir(path)) == "go-build" ||
		filepath.Base(path) == "b001" // b001 - типичная подпапка для go build
}

func NewPool() (*sql.DB, error) {
	db, err := sql.Open("sqlite", getAbsPath("tourneyHelperProject.db")+"?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, fmt.Errorf("sqlite | failed to open db: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite | database unreachable: %w", err)
	}

	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("sqlite3"); err != nil {
		return nil, fmt.Errorf("sqlite | failed to set dialect: %w", err)
	}

	if err := goose.Up(db, getAbsPath("migrations")); err != nil {
		return nil, fmt.Errorf("sqlite | migration failed: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	return db, nil
}
