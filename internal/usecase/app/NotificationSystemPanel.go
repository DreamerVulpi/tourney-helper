package application

import (
	"context"
	"fmt"
	"time"

	"strings"

	"net/url"

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

func (a *App) AuthorizeDiscord(clientID, clientSecret string) error {
	client := &auth.AuthClient{
		Config:         auth.GetDiscordOauth2(clientID, clientSecret),
		TokenFile:      "token_discord.json",
		CallbackPath:   "/discord/callback",
		CallbackServer: a.OAuthServer,
	}

	if err := client.Init(a.ctx); err != nil {
		return fmt.Errorf("failed to initialize discord client: %w", err)
	}

	_, err := client.GetAccessToken(client.TokenFile)
	if err != nil {
		return err
	}

	client.NamePlatform = "Discord"
	a.MessengerClient = client
	return nil
}

func (a *App) AuthorizeStartgg(clientID, clientSecret string) error {
	client := &auth.AuthClient{
		Config:         auth.GetStartggOauth2(clientID, clientSecret),
		TokenFile:      "token_startgg.json",
		CallbackPath:   "/startgg/callback",
		CallbackServer: a.OAuthServer,
	}

	if err := client.Init(a.ctx); err != nil {
		return fmt.Errorf("failed to initialize startgg client: %w", err)
	}

	_, err := client.GetAccessToken(client.TokenFile)
	if err != nil {
		return err
	}

	client.NamePlatform = "Startgg"
	a.TournamentClient = client
	return nil
}

func (a *App) InitSystemNotification(language string, cfgBot config.ConfigMessenger, cfgTournament config.ConfigTournament) (discord.Handler, error) {
	collectorStartgg := metrics.NewCollector()
	limiterStartgg := rateLimiter.NewStartggLimiter(collectorStartgg)

	adapter, err := sender.GetTournamentAdapter(collectorStartgg, a.TournamentClient, "Discord", cfgTournament.UrlToTournament, cfgBot.DebugMode.Mode, cfgTournament.Game.Name, nil)
	if err != nil {
		return discord.Handler{}, err
	}

	collectorDiscord := metrics.NewCollector()
	limiterDiscord := rateLimiter.NewDiscordLimiter(collectorDiscord)

	dh := discord.Handler{Auth: a.MessengerClient, Metrics: collectorDiscord}
	meDiscordPlatform, err := dh.Auth.GetDiscordMe(a.ctx)
	if err != nil {
		return discord.Handler{}, fmt.Errorf("InitDiscordHandler | Failed to get debug user: %v", err)
	}

	ns := sender.NewNotificationSystem(nil, adapter, a.Db, cfgBot.DebugMode.Mode, entitySender.Participant{
		MessengerID:    meDiscordPlatform.ID,
		MessengerLogin: meDiscordPlatform.Username,
		Locale:         strings.ToLower(language),
		GameName:       a.ConfigTournament.Game.Name,
	}, limiterDiscord, limiterStartgg, collectorDiscord, collectorStartgg, 5*time.Minute)
	dh.Ns = ns
	if a.ConfigMessenger.DebugMode.Mode {
		logger.Log(entityLogger.Warning, fmt.Sprintf("DEBUG MODE ON - Test contact is %v on platform %v", meDiscordPlatform.Username, "Discord"))
	}

	return dh, nil
}

func (a *App) ParseTournamentURL(platform string, rawURL string) (string, error) {
	if len(rawURL) == 0 {
		return "", fmt.Errorf("No URL provided")
	}

	rawURL = strings.TrimSpace(rawURL)

	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("Error parsing the URL: %v", err)
	}

	parts := strings.Split(u.Path, "/")

	switch strings.ToLower(platform) {
	case "startgg":
		if !strings.Contains(u.Host, "start.gg") {
			return "", fmt.Errorf("Url not supported for the platform start.gg")
		}

		tournamentIdx := -1
		eventIdx := -1

		for i, part := range parts {
			if part == "tournament" {
				tournamentIdx = i
			}
			if part == "event" {
				eventIdx = i
			}
		}

		if tournamentIdx != -1 && eventIdx != -1 && tournamentIdx+1 < len(parts) && eventIdx+1 < len(parts) {
			slug := fmt.Sprintf("tournament/%s/event/%s", parts[tournamentIdx+1], parts[eventIdx+1])
			return slug, nil
		}

		return "", fmt.Errorf("Invalid URL for start.gg. Expected format: .../tournament/NAME/event/NAME")

	case "challonge":
		if !strings.Contains(u.Host, "challonge.com") {
			return "", fmt.Errorf("URL not supported for the platform challonge.com")
		}

		if len(parts) == 0 {
			return "", fmt.Errorf("No URL provided")
		}

		knownLocales := map[string]bool{
			"ru": true, "en": true, "es": true, "fr": true, "de": true,
			"ja": true, "ko": true, "zh": true, "pt": true, "it": true,
		}

		var tourneySlug string
		if len(parts) >= 2 && knownLocales[strings.ToLower(parts[0])] {
			tourneySlug = parts[1]
		} else {
			tourneySlug = parts[0]
		}

		if len(tourneySlug) == 0 {
			return "", fmt.Errorf("Unable to extract the slug")
		}

		hostParts := strings.Split(u.Host, ".")
		if len(hostParts) > 2 && hostParts[0] != "www" {
			return fmt.Sprintf("%s-%s", hostParts[0], tourneySlug), nil
		}

		return tourneySlug, nil

	default:
		return "", fmt.Errorf("Unsupported tournament platform: %s", platform)
	}
}

func (a *App) StartSendNotifications(messenger, tournamentPlatform string, cfgBot config.ConfigMessenger, cfgTournament config.ConfigTournament, language string) error {
	a.mu.Lock()
	if a.ns != nil {
		a.mu.Unlock()
		err := fmt.Errorf("Mailing system is already running")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	a.mu.Unlock()

	switch messenger {
	case "discord":
		if len(cfgBot.Discord.Token) == 0 {
			err := fmt.Errorf("No token for discord authorization\n")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if len(cfgBot.Discord.ClientID) == 0 {
			err := fmt.Errorf("No clientID for bot authorization\n")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if len(cfgBot.Discord.SecretClient) == 0 {
			err := fmt.Errorf("No secretClient for bot authorization\n")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		err := a.AuthorizeDiscord(cfgBot.Discord.ClientID, cfgBot.Discord.SecretClient)
		if err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		logger.Log(entityLogger.Success, fmt.Sprintf("The client (%v) has been successfully readed", a.TournamentClient.NamePlatform))
	}

	if len(cfgTournament.UrlToTournament) == 0 {
		err := fmt.Errorf("No tournament url/slug for get data tournament\n")
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	switch tournamentPlatform {
	case "startgg":
		if len(cfgTournament.Startgg.ClientID) == 0 {
			err := fmt.Errorf("No clientID for authorization\n")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		if len(cfgTournament.Startgg.SecretClient) == 0 {
			err := fmt.Errorf("No secretClient for bot authorization\n")
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		err := a.AuthorizeStartgg(cfgTournament.Startgg.ClientID, cfgTournament.Startgg.SecretClient)
		if err != nil {
			logger.Log(entityLogger.Error, err.Error())
			return err
		}
		logger.Log(entityLogger.Success, fmt.Sprintf("The client (%v) has been successfully readed", a.MessengerClient.NamePlatform))
	}

	slug, err := a.ParseTournamentURL(tournamentPlatform, cfgTournament.UrlToTournament)
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return err
	}
	cfgTournament.UrlToTournament = slug
	if a.ConfigTournament != nil {
		a.ConfigTournament.UrlToTournament = slug
	}

	sn, err := a.InitSystemNotification(language, cfgBot, cfgTournament)
	if err != nil {
		logger.Log(entityLogger.Error, err.Error())
		return err
	}

	ctx, cancel := context.WithCancel(context.Background())
	a.mu.Lock()
	a.ns = sn.Ns
	a.activeBot = &sn
	a.nsCancel = cancel
	sn.ReadyChan = make(chan struct{})
	a.mu.Unlock()

	go func() {
		if err := a.activeBot.Start(ctx, a.TournamentClient, a.Db.Conn, cfgBot, cfgTournament); err != nil {
			logger.Log(entityLogger.Error, err.Error())
		}
	}()
	go func() {
		select {
		case <-sn.ReadyChan:
			logger.Log(entityLogger.Info, "The bot has been launched. Starting to send out notifications...")
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
