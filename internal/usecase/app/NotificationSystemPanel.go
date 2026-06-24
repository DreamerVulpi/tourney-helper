package application

import (
	"context"
	"fmt"
	"log"

	"strings"

	"net/url"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/bot/discord"
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
	log.Printf("DiscordClient: %v", client)
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

	log.Printf("StartggClient: %v", client)
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
	})
	dh.Ns = ns
	if a.ConfigMessenger.DebugMode.Mode {
		log.Printf("DEBUG MODE ON - Test contact is %v on platform %v", meDiscordPlatform.Username, "Discord")
	}

	return dh, nil
}

func (a *App) ParseTournamentURL(platform string, rawURL string) (string, error) {
	if len(rawURL) == 0 {
		return "", fmt.Errorf("no URL provided")
	}

	rawURL = strings.TrimSpace(rawURL)

	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("error parsing the URL: %v", err)
	}

	parts := strings.Split(u.Path, "/")

	switch strings.ToLower(platform) {
	case "startgg":
		if !strings.Contains(u.Host, "start.gg") {
			return "", fmt.Errorf("url not supported for the platform start.gg")
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

		return "", fmt.Errorf("invalid URL for start.gg. Expected format: .../tournament/NAME/event/NAME")

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

// TODO: Add logs in frontend
func (a *App) StartSendNotifications(messenger, tournamentPlatform string, cfgBot config.ConfigMessenger, cfgTournament config.ConfigTournament, language string) error {
	log.Printf("Messenger: %v, TournamentPlatform: %v, ConfigBot: %v, ConfigTournament: %v", messenger, tournamentPlatform, cfgBot, cfgTournament)

	a.mu.Lock()
	if a.ns != nil {
		a.mu.Unlock()
		return fmt.Errorf("mailing system is already running")
	}
	a.mu.Unlock()

	switch messenger {
	case "discord":
		if len(cfgBot.Discord.Token) == 0 {
			return fmt.Errorf("no token for discord authorization\n")
		}
		if len(cfgBot.Discord.ClientID) == 0 {
			return fmt.Errorf("no clientID for bot authorization\n")
		}
		if len(cfgBot.Discord.SecretClient) == 0 {
			return fmt.Errorf("no secretClient for bot authorization\n")
		}
		err := a.AuthorizeDiscord(cfgBot.Discord.ClientID, cfgBot.Discord.SecretClient)
		if err != nil {
			return err
		}
	}

	if len(cfgTournament.UrlToTournament) == 0 {
		return fmt.Errorf("no tournament url/slug for get data tournament\n")
	}
	switch tournamentPlatform {
	case "startgg":
		if len(cfgTournament.Startgg.ClientID) == 0 {
			return fmt.Errorf("no clientID for authorization\n")
		}
		if len(cfgTournament.Startgg.SecretClient) == 0 {
			return fmt.Errorf("no secretClient for bot authorization\n")
		}
		err := a.AuthorizeStartgg(cfgTournament.Startgg.ClientID, cfgTournament.Startgg.SecretClient)
		if err != nil {
			return err
		}
	}

	url, err := a.ParseTournamentURL(tournamentPlatform, cfgTournament.UrlToTournament)
	cfgTournament.UrlToTournament = url
	if a.ConfigTournament != nil {
		a.ConfigTournament.UrlToTournament = url
	}

	sn, err := a.InitSystemNotification(language)
	if err != nil {
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
			log.Println(err)
		}
	}()

	return nil
}

func (a *App) StopSendNotifications() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.ns == nil {
		return fmt.Errorf("mailing system isn't running")
	}
	log.Println("Stopping notification system...")

	if a.nsCancel != nil {
		a.nsCancel()
	}

	if a.activeBot != nil {
		if err := a.activeBot.Stop(); err != nil {
			log.Printf("error during bot stop: %v\n", err)
		}
	}

	a.ns = nil
	a.nsCancel = nil
	a.activeBot = nil

	log.Println("notification system stopped successfully.")
	return nil
}
