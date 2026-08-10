package update

import (
	"errors"
)

var (
	ErrProvider = errors.New("provider error")
	ErrDownload = errors.New("download error")
	ErrExtract  = errors.New("extract error")
	ErrLauncher = errors.New("launcher error")
	ErrNoAsset  = errors.New("no asset")
	ErrUpToDate = errors.New("already up to date")
)
