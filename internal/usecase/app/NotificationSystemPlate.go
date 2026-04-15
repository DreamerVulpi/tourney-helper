package application

import (
	"fmt"
	"log"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
)

func (a *App) AuthorizeDiscord(clientID, clientSecret string) error {
	client := &auth.AuthClient{
		Config:    auth.GetDiscordOauth2(clientID, clientSecret),
		TokenFile: "token_discord.json",
	}

	_, err := client.GetAccessToken(client.TokenFile)
	if err != nil {
		return err
	}

	client.NamePlatform = "discord"
	a.MessengerClient = client
	return nil
}

func (a *App) AuthorizeStartgg(clientID, clientSecret string) error {
	client := &auth.AuthClient{
		Config:    auth.GetStartggOauth2(clientID, clientSecret),
		TokenFile: "token_startgg.json",
	}
	_, err := client.GetAccessToken(client.TokenFile)
	if err != nil {
		return err
	}

	client.NamePlatform = "startgg"
	a.TournamentClient = client
	return nil
}

func (a *App) StartSendNotifications(messenger, tournamentPlatform string, cfgBot config.ConfigMessenger, cfgTournament config.ConfigTournament) error {
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

	log.Println(cfgBot)
	log.Println(cfgTournament)

	return nil
}
