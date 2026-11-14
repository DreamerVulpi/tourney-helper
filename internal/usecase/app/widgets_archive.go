package application

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const widgetsContentDir = "widgets"

// ============================================================
// WIDGETS CONTENT (widgets/ directory)
// ============================================================

func widgetsContentRoot() string {
	return config.GetAbsPath(widgetsContentDir)
}

// ExportWidgetsContent упаковывает всю директорию widgets/ (темы, логотипы,
// плашки и т.д.) в zip-архив.
func (a *App) ExportWidgetsContent() (string, error) {
	srcDir := widgetsContentRoot()
	if info, err := os.Stat(srcDir); err != nil {
		if os.IsNotExist(err) {
			return "", fmt.Errorf("widgets content directory does not exist: %s", srcDir)
		}
		return "", err
	} else if !info.IsDir() {
		return "", fmt.Errorf("widgets content path is not a directory: %s", srcDir)
	}

	savePath, err := wruntime.SaveFileDialog(a.ctx, wruntime.SaveDialogOptions{
		Title:           "Export widgets content",
		DefaultFilename: "widgets-content.zip",
		Filters: []wruntime.FileFilter{
			{DisplayName: "Widgets content archive (*.zip)", Pattern: "*.zip"},
		},
	})
	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", nil
	}
	if !strings.HasSuffix(strings.ToLower(savePath), ".zip") {
		savePath += ".zip"
	}

	if err := zipDirectory(srcDir, savePath); err != nil {
		return "", fmt.Errorf("create widgets content archive: %w", err)
	}

	logger.Log(entityLogger.Info, fmt.Sprintf(
		"widgets content exported: %s -> %s", srcDir, savePath,
	))

	return savePath, nil
}

// ImportWidgetsContent распаковывает zip-архив в директорию widgets/.
// Существующие файлы с теми же путями перезаписываются.
func (a *App) ImportWidgetsContent() (string, error) {
	openPath, err := wruntime.OpenFileDialog(a.ctx, wruntime.OpenDialogOptions{
		Title: "Import widgets content",
		Filters: []wruntime.FileFilter{
			{DisplayName: "Widgets content archive (*.zip)", Pattern: "*.zip"},
		},
	})
	if err != nil {
		return "", err
	}
	if openPath == "" {
		return "", nil
	}

	dstRoot := widgetsContentRoot()
	if err := os.MkdirAll(dstRoot, 0o755); err != nil {
		return "", fmt.Errorf("create widgets content directory: %w", err)
	}

	if err := unzipWidgetsContent(openPath, dstRoot); err != nil {
		return "", fmt.Errorf("extract widgets content archive: %w", err)
	}

	logger.Log(entityLogger.Info, fmt.Sprintf(
		"widgets content imported: %s -> %s", openPath, dstRoot,
	))

	return openPath, nil
}

// ============================================================
// ZIP HELPERS
// ============================================================

func zipDirectory(srcDir, dstPath string) error {
	outFile, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	zipWriter := zip.NewWriter(outFile)
	defer zipWriter.Close()

	return filepath.Walk(srcDir, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if info.IsDir() {
			return nil
		}

		rel, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		header.Name = filepath.ToSlash(rel)
		header.Method = zip.Deflate

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}

		_, copyErr := io.Copy(writer, file)
		closeErr := file.Close()
		if copyErr != nil {
			return copyErr
		}
		return closeErr
	})
}

func unzipWidgetsContent(zipPath, dstRoot string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	root := filepath.Clean(dstRoot)
	rootPrefix := root + string(os.PathSeparator)

	for _, file := range reader.File {
		name := filepath.ToSlash(file.Name)
		name = strings.TrimPrefix(name, "./")
		name = strings.TrimPrefix(name, "/")

		// Поддерживаем архивы, собранные как из самой widgets/, так и из
		// её родительской директории (с префиксом widgets/).
		name = strings.TrimPrefix(name, widgetsContentDir+"/")

		if name == "" || name == widgetsContentDir {
			continue
		}

		dest := filepath.Clean(filepath.Join(root, filepath.FromSlash(name)))
		if dest != root && !strings.HasPrefix(dest, rootPrefix) {
			return fmt.Errorf("illegal file path in archive: %s", file.Name)
		}

		if file.FileInfo().IsDir() {
			if err := os.MkdirAll(dest, 0o755); err != nil {
				return err
			}
			continue
		}

		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return err
		}

		if err := extractZipEntry(file, dest); err != nil {
			return err
		}
	}

	return nil
}

func extractZipEntry(file *zip.File, dest string) error {
	rc, err := file.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	mode := file.Mode()
	if mode == 0 {
		mode = 0o644
	}

	out, err := os.OpenFile(dest, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, mode)
	if err != nil {
		return err
	}

	_, copyErr := io.Copy(out, rc)
	closeErr := out.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}
