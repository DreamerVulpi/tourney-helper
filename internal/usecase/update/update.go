package update

import (
	"io"
	"os"
	"path/filepath"

	"os/exec"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

type Updater struct{}

func NewUpdater() *Updater {
	return &Updater{}
}

func (u *Updater) Run(pid int, source string, target string, exeName string) error {
	// 1
	if err := u.waitProcess(pid); err != nil {
		return err
	}
	//2
	if err := u.copyFiles(source, target); err != nil {
		return err
	}
	// 3
	if err := u.startApplication(target, exeName); err != nil {
		return err
	}
	// 4
	if err := u.cleanup(source); err != nil {
		logger.Log(entityLogger.Error, "can't clean garbage files..")
	}

	return nil
}

func (u *Updater) copyFiles(source, target string) error {
	return filepath.Walk(source, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relative, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}

		dst := filepath.Join(target, relative)
		if info.IsDir() {
			return os.MkdirAll(dst, info.Mode())
		}
		return copyFile(path, dst, info.Mode())
	})
}

func copyFile(src, dst string, mode os.FileMode) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, mode)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func (u *Updater) startApplication(target string, exeName string) error {
	exePath := filepath.Join(target, exeName)
	cmd := exec.Command(exePath)
	cmd.Dir = target
	return cmd.Start()
}

// func (u *Updater) startApplication(target string, exeName string) error {
// 	exePath := filepath.Join(target, exeName)

// 	logger.Log(entityLogger.Info, "EXE PATH: "+exePath)

// 	cmd := exec.Command(exePath)
// 	cmd.Dir = target

// 	if err := cmd.Start(); err != nil {
// 		logger.Log(
// 			entityLogger.Error,
// 			"START ERROR: "+err.Error(),
// 		)
// 		return err
// 	}

// 	logger.Log(
// 		entityLogger.Info,
// 		fmt.Sprintf("STARTED PID: %d", cmd.Process.Pid),
// 	)

// 	return nil
// }

func (u *Updater) cleanup(source string) error {
	return os.RemoveAll(source)
}
