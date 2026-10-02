package application

import (
	"context"
	"fmt"
	"time"

	"strings"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entityMetrics "github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	entityPlatformRules "github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	"github.com/dreamervulpi/tourney-helper/internal/entity/update"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/bot/discord"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/sender"
)

func (a *App) CheckUpdate() (*update.UpdateInfo, error) {
	return a.UpdateService.Check(a.ctx)
}

func (a *App) IsNotificationSystemReady() bool {
	if a.ns == nil {
		return false
	}
	return a.ns.IsReady()
}

func (a *App) GetNotificationMetrics() entityMetrics.Snapshot {
	if a.ns == nil {
		return entityMetrics.Snapshot{}
	}
	return a.ns.GetMessengerMetrics()
}

func (a *App) GetGetDataMetrics() entityMetrics.Snapshot {
	if a.ns == nil {
		return entityMetrics.Snapshot{}
	}
	return a.ns.GetTournamentPlatformMetrics()
}

func (a *App) GetNotificationLimits() entityPlatformRules.Limits {
	if a.ns == nil {
		return entityPlatformRules.Limits{}
	}
	return a.ns.GetMessengerLimits()
}

func (a *App) GetMessengerMessageLimit() int64 {
	if a.ns == nil {
		return 0
	}
	return a.ns.GetMessengerMessageLimit()
}

func (a *App) GetTournamentPlatformLimits() entityPlatformRules.Limits {
	if a.ns == nil {
		return entityPlatformRules.Limits{}
	}
	return a.ns.GetTournamentPlatformLimits()
}

func (a *App) AuthorizeDiscord(clientID, clientSecret string, slotIndex int) error {
	if a.ActiveProfile == "" {
		return fmt.Errorf("no active profile")
	}
	if slotIndex < 0 || slotIndex >= config.SlotsPerPlatform {
		return fmt.Errorf("invalid slot index: %d", slotIndex)
	}

	if err := config.EnsureClientDir(a.ActiveProfile); err != nil {
		return fmt.Errorf("failed to ensure client dir: %w", err)
	}

	tokenPath := config.GetClientTokenPath(a.ActiveProfile, "discord", slotIndex)

	client := &auth.AuthClient{
		Config:         auth.GetDiscordOauth2(clientID, clientSecret),
		TokenFile:      tokenPath, // ← абсолютный путь в профиле
		CallbackPath:   "/discord/callback",
		CallbackServer: a.OAuthServer,
	}

	if err := client.Init(a.ctx); err != nil {
		return fmt.Errorf("failed to initialize discord client: %w", err)
	}

	client.NamePlatform = "Discord"
	a.MessengerClient = client
	return nil
}

func (a *App) AuthorizeStartgg(clientID, clientSecret string, slotIndex int) error {
	if a.ActiveProfile == "" {
		return fmt.Errorf("no active profile")
	}
	if slotIndex < 0 || slotIndex >= config.SlotsPerPlatform {
		return fmt.Errorf("invalid slot index: %d", slotIndex)
	}

	if err := config.EnsureClientDir(a.ActiveProfile); err != nil {
		return fmt.Errorf("failed to ensure client dir: %w", err)
	}

	tokenPath := config.GetClientTokenPath(a.ActiveProfile, "startgg", slotIndex)

	client := &auth.AuthClient{
		Config:         auth.GetStartggOauth2(clientID, clientSecret),
		TokenFile:      tokenPath,
		CallbackPath:   "/startgg/callback",
		CallbackServer: a.OAuthServer,
	}

	if err := client.Init(a.ctx); err != nil {
		return fmt.Errorf("failed to initialize startgg client: %w", err)
	}

	client.NamePlatform = "Startgg"
	a.TournamentClient = client
	return nil
}

func (a *App) InitSystemNotification(
	settings config.SettingsApplication,
	botCred config.ClientCredentials,
	tourneyCred config.ClientCredentials,
	cfgTournament config.ConfigTournament,
) (*discord.Handler, error) {
	collectorStartgg := metrics.NewCollector()
	limiterStartgg := rateLimiter.NewStartggLimiter(collectorStartgg)

	adapter, err := sender.GetTournamentAdapter(
		collectorStartgg,
		a.TournamentClient,
		"Discord",
		cfgTournament.UrlToTournament,
		settings.DebugMode,
		cfgTournament.Game.Name,
		nil,
	)
	if err != nil {
		return &discord.Handler{}, err
	}

	collectorDiscord := metrics.NewCollector()
	limiterDiscord := rateLimiter.NewDiscordLimiter(collectorDiscord)

	dh := discord.Handler{Auth: a.MessengerClient, Metrics: collectorDiscord}

	meDiscordPlatform, err := dh.Auth.GetDiscordMe(a.ctx)
	if err != nil {
		return &discord.Handler{}, fmt.Errorf("InitDiscordHandler | Failed to get debug user: %v", err)
	}

	ns := sender.NewNotificationSystem(
		nil,
		adapter,
		a.Db,
		settings.DebugMode, // ← было cfgBot.DebugMode.Mode
		entitySender.Participant{
			MessengerID:    meDiscordPlatform.ID,
			MessengerLogin: meDiscordPlatform.Username,
			Locale:         strings.ToLower(settings.Language), // ← было language
			GameName:       a.ConfigTournament.Game.Name,
		},
		limiterDiscord,
		limiterStartgg,
		collectorDiscord,
		collectorStartgg,
		5*time.Minute,
	)
	dh.Ns = ns

	if settings.DebugMode { // ← было a.ConfigMessenger.DebugMode.Mode
		logger.Log(entityLogger.Warning,
			fmt.Sprintf("DEBUG MODE ON - Test contact is %v on platform %v",
				meDiscordPlatform.Username, "Discord"))
	}

	return &dh, nil
}

func (a *App) StartSendNotifications(
	messenger, tournamentPlatform string,
	cfgAuthorizations config.ConfigAuthorizations,
	cfgTournament config.ConfigTournament,
	settings config.SettingsApplication,
) error {
	a.mu.Lock()
	if a.ns != nil {
		a.mu.Unlock()
		err := fmt.Errorf("Mailing system is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.mu.Unlock()

	// ========================================================
	// 0. Определяем активные слоты заранее
	// ========================================================
	var botCred config.ClientCredentials
	var botSlotIndex int
	switch messenger {
	case "discord":
		cred, idx, ok := cfgAuthorizations.Discord.GetActiveSlotWithIndex()
		if !ok {
			err := fmt.Errorf("no active discord client slot")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		botCred, botSlotIndex = cred, idx
	case "telegram":
		cred, idx, ok := cfgAuthorizations.Telegram.GetActiveSlotWithIndex()
		if !ok {
			err := fmt.Errorf("no active telegram client slot")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		botCred, botSlotIndex = cred, idx
	default:
		err := fmt.Errorf("unknown messenger: %s", messenger)
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	var tourneyCred config.ClientCredentials
	var tourneySlotIndex int
	switch tournamentPlatform {
	case "startgg":
		cred, idx, ok := cfgAuthorizations.Startgg.GetActiveSlotWithIndex()
		if !ok {
			err := fmt.Errorf("no active client slot for startgg")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		tourneyCred, tourneySlotIndex = cred, idx
	case "challonge":
		cred, idx, ok := cfgAuthorizations.Challonge.GetActiveSlotWithIndex()
		if !ok {
			err := fmt.Errorf("no active client slot for challonge")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		tourneyCred, tourneySlotIndex = cred, idx
	default:
		err := fmt.Errorf("unknown tournament platform: %s", tournamentPlatform)
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	// ========================================================
	// 1. Авторизация мессенджера
	// ========================================================
	switch messenger {
	case "discord":
		if botCred.Token == "" {
			err := fmt.Errorf("no token in discord slot #%d", botSlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if botCred.ClientID == "" {
			err := fmt.Errorf("no clientID in discord slot #%d", botSlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if botCred.SecretClient == "" {
			err := fmt.Errorf("no secretClient in discord slot #%d", botSlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}

		if err := a.AuthorizeDiscord(botCred.ClientID, botCred.SecretClient, botSlotIndex); err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		logger.Log(entityLogger.Success, fmt.Sprintf("Discord slot #%d authorized", botSlotIndex+1))

	case "telegram":
		if botCred.Token == "" {
			err := fmt.Errorf("no token in telegram slot #%d", botSlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		// TODO: a.AuthorizeTelegram(...)
	}

	// ========================================================
	// 2. Проверка URL турнира
	// ========================================================
	if len(cfgTournament.UrlToTournament) == 0 {
		err := fmt.Errorf("no tournament url/slug for get data tournament")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	// ========================================================
	// 3. Авторизация турнирной платформы
	// ========================================================
	switch tournamentPlatform {
	case "startgg":
		if tourneyCred.ClientID == "" {
			err := fmt.Errorf("no clientID in startgg slot #%d", tourneySlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if tourneyCred.SecretClient == "" {
			err := fmt.Errorf("no secretClient in startgg slot #%d", tourneySlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}

		if err := a.AuthorizeStartgg(tourneyCred.ClientID, tourneyCred.SecretClient, tourneySlotIndex); err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		logger.Log(entityLogger.Success, fmt.Sprintf("Start.gg slot #%d authorized", tourneySlotIndex+1))

	case "challonge":
		if tourneyCred.ClientID == "" || tourneyCred.SecretClient == "" {
			err := fmt.Errorf("challonge slot #%d has empty credentials", tourneySlotIndex+1)
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		// TODO: a.AuthorizeChallonge(...)
	}

	// ========================================================
	// 4. Парсинг URL и сохранение slug
	// ========================================================
	slug, err := a.ParseTournamentURLForNotification(tournamentPlatform, cfgTournament.UrlToTournament)
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	cfgTournament.UrlToTournament = slug
	if a.ConfigTournament != nil {
		a.ConfigTournament.UrlToTournament = slug
	}

	// ========================================================
	// 5. Инициализация системы уведомлений
	// ========================================================
	sn, err := a.InitSystemNotification(
		settings,
		botCred,
		tourneyCred,
		cfgTournament,
	)
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	ctx, cancel := context.WithCancel(context.Background())
	a.mu.Lock()
	a.ns = sn.Ns
	a.activeBot = sn
	a.nsCancel = cancel
	sn.ReadyChan = make(chan struct{})
	a.mu.Unlock()

	// ========================================================
	// 6. Запуск бота
	// ========================================================
	go func() {
		if err := a.activeBot.Start(
			ctx,
			a.TournamentClient,
			a.Db.Conn,
			botCred,
			tourneyCred,
			cfgTournament,
			settings,
		); err != nil {
			logger.Log(entityLogger.Error, err.Error())
		}
	}()

	go func() {
		select {
		case <-sn.ReadyChan:
			logger.Log(entityLogger.Info,
				"The bot has been launched. Starting to send out notifications...")
			sn.StartSendMessages()
		case <-ctx.Done():
			return
		}
	}()

	return nil
}

func (a *App) StopSendNotifications() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.ns == nil {
		err := fmt.Errorf("Mailing system isn't running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	logger.Log(entityLogger.Info, "Stopping the notifications...")

	if a.nsCancel != nil {
		a.nsCancel()
	}

	if a.activeBot != nil {
		if err := a.activeBot.Stop(); err != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("Couldn't stop the bot from running: %v\n", err))
		}
	}

	a.ns = nil
	a.nsCancel = nil
	a.activeBot = nil

	logger.Log(entityLogger.Success, "The notification system was successfully stopped")
	return nil
}
