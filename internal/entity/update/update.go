package update

import (
	"time"
)

type ReleaseInfo struct {
	Version     string
	Name        string
	Description Description
	PublishedAt time.Time
	URL         string
	Assets      []Asset
}

type Description struct {
	English string
	Russian string
}

type Asset struct {
	Name string
	URL  string
	Size int64
}

type UpdateInfo struct {
	Available bool
	Current   string
	Latest    *ReleaseInfo
}
