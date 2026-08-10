//go:build windows

package update

import (
	"fmt"

	"golang.org/x/sys/windows"
)

func (u *Updater) waitProcess(pid int) error {
	handle, err := windows.OpenProcess(
		windows.SYNCHRONIZE,
		false,
		uint32(pid),
	)
	if err != nil {
		return nil
	}

	defer windows.CloseHandle(handle)

	_, err = windows.WaitForSingleObject(
		handle,
		windows.INFINITE,
	)
	if err != nil {
		return fmt.Errorf("wait process: %w", err)
	}

	return nil
}
