package update

type Launcher interface {
	Start(updater string, pid int, source string, target string, exeName string) error
}
