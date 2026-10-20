package application

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) ExportProfile(profileName string) (string, error) {
	if profileName == "" {
		return "", fmt.Errorf("profile name is empty")
	}

	srcDir := config.GetProfileDir(profileName)
	if _, err := os.Stat(srcDir); os.IsNotExist(err) {
		return "", fmt.Errorf("profile %q not found", profileName)
	}

	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export profile",
		DefaultFilename: fmt.Sprintf("%s.tourneyprofile.zip", profileName),
		Filters: []runtime.FileFilter{
			{DisplayName: "Tourney Profile Archive (*.zip)", Pattern: "*.zip"},
		},
	})
	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", nil
	}

	archive, err := os.Create(savePath)
	if err != nil {
		return "", err
	}
	defer archive.Close()

	zipWriter := zip.NewWriter(archive)
	defer zipWriter.Close()

	err = filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		header.Name = filepath.ToSlash(relPath)
		header.Method = zip.Deflate

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		return err
	})

	if err != nil {
		return "", fmt.Errorf("failed to write archive: %w", err)
	}

	return savePath, nil
}

func (a *App) ImportProfile() (string, error) {
	openPath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import profile",
		Filters: []runtime.FileFilter{
			{DisplayName: "Tourney Profile Archive (*.zip)", Pattern: "*.zip"},
		},
	})
	if err != nil {
		return "", err
	}
	if openPath == "" {
		return "", nil
	}

	r, err := zip.OpenReader(openPath)
	if err != nil {
		return "", fmt.Errorf("invalid zip archive: %w", err)
	}
	defer r.Close()

	tempDir, err := os.MkdirTemp("", "tourney-import-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	for _, f := range r.File {
		destPath := filepath.Join(tempDir, f.Name)
		if !strings.HasPrefix(destPath, filepath.Clean(tempDir)+string(os.PathSeparator)) {
			return "", fmt.Errorf("illegal file path in zip: %s", f.Name)
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(destPath, os.ModePerm)
			continue
		}

		os.MkdirAll(filepath.Dir(destPath), os.ModePerm)

		rc, err := f.Open()
		if err != nil {
			return "", err
		}

		outFile, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			rc.Close()
			return "", err
		}

		_, err = io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()
		if err != nil {
			return "", err
		}
	}

	profileRootDir := tempDir
	dbFound := false

	_ = filepath.Walk(tempDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".db") {
			profileRootDir = filepath.Dir(path)
			dbFound = true
			return filepath.SkipAll
		}
		return nil
	})

	if !dbFound {
		if _, err := os.Stat(filepath.Join(tempDir, config.ProfileDbFileName)); os.IsNotExist(err) {
			return "", fmt.Errorf("archive does not contain a valid database file")
		}
	}

	var baseName string

	if profileRootDir != tempDir {
		baseName = filepath.Base(profileRootDir)
	} else {
		zipFileName := filepath.Base(openPath)
		baseName = strings.TrimSuffix(zipFileName, ".tourneyprofile.zip")
		baseName = strings.TrimSuffix(baseName, ".zip")
	}

	baseName = strings.TrimSpace(baseName)
	validNameRe := regexp.MustCompile(`[^a-zA-Z0-9 _\-()#\p{Cyrillic}]`)
	baseName = validNameRe.ReplaceAllString(baseName, "_")
	baseName = strings.Trim(baseName, "_ ")

	if baseName == "" {
		baseName = "Imported Profile"
	}

	profileName := baseName
	counter := 1

	for {
		if _, err := os.Stat(config.GetProfileDir(profileName)); os.IsNotExist(err) {
			break
		}
		profileName = fmt.Sprintf("%s (%d)", baseName, counter)
		counter++
	}

	dstDir := config.GetProfileDir(profileName)

	if err := config.CopyDirRecursive(profileRootDir, dstDir); err != nil {
		_ = os.RemoveAll(dstDir)
		return "", fmt.Errorf("failed to copy imported profile files: %w", err)
	}

	if err := config.CreateProfile(profileName); err != nil {
		_ = os.RemoveAll(dstDir)
		return "", fmt.Errorf("failed to register imported profile: %w", err)
	}

	return profileName, a.SwitchProfile(profileName)
}
