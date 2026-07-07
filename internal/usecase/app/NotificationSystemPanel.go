package application

import (
	"context"
	"fmt"
	"time"

	"strings"

	"net/url"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/bot/discord"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/logger"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/sender"
)

func (a *App) AuthorizeDiscord(clientID, clientSecret string) error {
	client := &auth.AuthClient{
		Config:    auth.GetDiscordOauth2(clientID, clientSecret),
		TokenFile: "token_discord.json",
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
	a.Log(logger.Success, fmt.Sprintf("The client (%v) has been successfully readed: %v", client.NamePlatform, client))
	return nil
}

func (a *App) AuthorizeStartgg(clientID, clientSecret string) error {
	client := &auth.AuthClient{
		Config:    auth.GetStartggOauth2(clientID, clientSecret),
		TokenFile: "token_startgg.json",
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

	a.Log(logger.Success, fmt.Sprintf("The client (%v) has been successfully readed: %v", client.NamePlatform, client))
	return nil
}

func (a *App) InitSystemNotification(language string) (discord.Handler, error) {
	adapter, err := sender.GetTournamentAdapter(a.TournamentClient, "Discord", a.ConfigTournament.UrlToTournament, a.ConfigMessenger.DebugMode.Mode, a.ConfigTournament.Game.Name, nil)
	if err != nil {
		return discord.Handler{}, err
	}

	dh := discord.Handler{Auth: a.MessengerClient}
	meDiscordPlatform, err := dh.Auth.GetDiscordMe(a.ctx)
	if err != nil {
		return discord.Handler{}, fmt.Errorf("InitDiscordHandler | Failed to get debug user: %v", err)
	}

	ns := sender.NewNotificationSystem(nil, adapter, a.Db, a.ConfigMessenger.DebugMode.Mode, entitySender.Participant{
		MessenagerID:    meDiscordPlatform.ID,
		MessenagerLogin: meDiscordPlatform.Username,
		Locale:          strings.ToLower(language),
		GameName:        a.ConfigTournament.Game.Name,
	}, 5*time.Minute)
	dh.Ns = ns
	if a.ConfigMessenger.DebugMode.Mode {
		a.Log(logger.Info, fmt.Sprintf("DEBUG MODE ON - Test contact is %v on platform %v", meDiscordPlatform.Username, "Discord"))
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
		a.Log(logger.Error, err.Error())
		return err
	}
	a.mu.Unlock()

	switch messenger {
	case "discord":
		if len(cfgBot.Discord.Token) == 0 {
			err := fmt.Errorf("No token for discord authorization\n")
			a.Log(logger.Error, err.Error())
			return err
		}
		if len(cfgBot.Discord.ClientID) == 0 {
			err := fmt.Errorf("No clientID for bot authorization\n")
			a.Log(logger.Error, err.Error())
			return err
		}
		if len(cfgBot.Discord.SecretClient) == 0 {
			err := fmt.Errorf("No secretClient for bot authorization\n")
			a.Log(logger.Error, err.Error())
			return err
		}
		err := a.AuthorizeDiscord(cfgBot.Discord.ClientID, cfgBot.Discord.SecretClient)
		if err != nil {
			a.Log(logger.Error, err.Error())
			return err
		}
	}

	if len(cfgTournament.UrlToTournament) == 0 {
		err := fmt.Errorf("No tournament url/slug for get data tournament\n")
		a.Log(logger.Error, err.Error())
		return err
	}
	switch tournamentPlatform {
	case "startgg":
		if len(cfgTournament.Startgg.ClientID) == 0 {
			err := fmt.Errorf("No clientID for authorization\n")
			a.Log(logger.Error, err.Error())
			return err
		}
		if len(cfgTournament.Startgg.SecretClient) == 0 {
			err := fmt.Errorf("No secretClient for bot authorization\n")
			a.Log(logger.Error, err.Error())
			return err
		}
		err := a.AuthorizeStartgg(cfgTournament.Startgg.ClientID, cfgTournament.Startgg.SecretClient)
		if err != nil {
			a.Log(logger.Error, err.Error())
			return err
		}
	}

	slug, err := a.ParseTournamentURL(tournamentPlatform, cfgTournament.UrlToTournament)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return err
	}
	cfgTournament.UrlToTournament = slug
	if a.ConfigTournament != nil {
		a.ConfigTournament.UrlToTournament = slug
	}

	sn, err := a.InitSystemNotification(language)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return err
	}

	ctx, cancel := context.WithCancel(context.Background())
	a.mu.Lock()
	a.ns = sn.Ns
	a.activeBot = &sn
	a.nsCancel = cancel
	a.mu.Unlock()

	go func() {
		if err := a.activeBot.Start(ctx, a.TournamentClient, a.Db.Conn, *a.ConfigMessenger, *a.ConfigTournament); err != nil {
			a.Log(logger.Error, err.Error())
		}
	}()
	go func() {
		readySignal := sn.ReadyChan
		select {
		case <-readySignal:
			a.Log(logger.Info, "The bot has been launched. Starting to send out notifications...")
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
		a.Log(logger.Error, err.Error())
		return err
	}
	a.Log(logger.Info, "Stopping the notifications...")

	if a.nsCancel != nil {
		a.nsCancel()
	}

	if a.activeBot != nil {
		if err := a.activeBot.Stop(); err != nil {
			a.Log(logger.Error, fmt.Sprintf("Couldn't stop the bot from running: %v\n", err))
		}
	}

	a.ns = nil
	a.nsCancel = nil
	a.activeBot = nil

	a.Log(logger.Success, "The notification system was successfully stopped")
	return nil
}
