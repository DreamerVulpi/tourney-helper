package update

type Installer interface {
	Extract(zipFile string, destination string) error
}
