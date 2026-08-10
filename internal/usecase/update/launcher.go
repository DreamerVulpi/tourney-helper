package update

import (
	"os/exec"
	"strconv"
)

type Launcher struct{}

func NewLauncher() *Launcher {
	return &Launcher{}
}

func (l *Launcher) Start(updaterPath string, pid int, sourceDir string, targetDir string, exeName string) error {
	cmd := exec.Command(updaterPath, strconv.Itoa(pid), sourceDir, targetDir, exeName)
	return cmd.Start()
}
