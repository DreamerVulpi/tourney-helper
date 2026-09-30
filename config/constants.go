package config

const (
	// SlotsPerPlatform — количество слотов для авторизации клиентов на каждой платформе.
	SlotsPerPlatform = 5

	// MaxClientNameLength — максимальная длина имени клиента.
	MaxClientNameLength = 17

	// DefaultProfileName — имя профиля, создаваемого при миграции со старого формата.
	DefaultProfileName = "default"

	// ProfilesRegistryFile — имя файла реестра профилей.
	ProfilesRegistryFile = "profiles.toml"

	// ProfileConfigsDir — имя подпапки с конфигами внутри профиля.
	ProfileConfigsDir = "configs"

	// ProfileClientsDir — имя подпапки с сессиями клиентов внутри профиля.
	ProfileClientsDir = "clients"

	// Имена файлов внутри профиля.
	SettingsFile       = "settings.toml"
	WidgetsFile        = "widgets.toml"
	TournamentFile     = "tournament.toml"
	AuthorizationsFile = "authorizations.toml"
)
