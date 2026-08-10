package update

import "context"

type Downloader interface {
	Download(ctx context.Context, asset Asset, destination string, progress func(downloaded, total int64)) error
}
