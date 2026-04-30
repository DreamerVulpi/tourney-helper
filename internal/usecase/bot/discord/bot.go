package discord

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"sync"

	"context"

	"database/sql"

	"github.com/bwmarrin/discordgo"
	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
	usecaseSender "github.com/dreamervulpi/tourneyBot/internal/usecase/sender"
)

type params struct {
	guildID        string
	logo           string
	tournament     config.ConfigTournament
	rulesMatches   config.RulesMatches
	streamLobby    config.StreamLobby
	rolesIdList    config.RolesID
	debugMode      bool
	debugChannelID string
}

type Handler struct {
	Auth               *auth.AuthClient
	Ns                 *usecaseSender.NotificationSystem
	tournamentPlatform string
	contacts           preparedContacts
	cancel             context.CancelFunc
	mtx                sync.Mutex
	params             params
}

func (dh *Handler) InitBot(cfg config.ConfigMessenger, activeTournamentPlatform string, tournament config.ConfigTournament) {
	dh.tournamentPlatform = activeTournamentPlatform
	dh.params.guildID = cfg.Discord.GuildID
	dh.params.debugMode = cfg.DebugMode.Mode
	dh.params.tournament = tournament
	dh.params.rulesMatches = config.RulesMatches{
		StandardFormat: tournament.Rules.StandardFormat,
		FinalsFormat:   tournament.Rules.FinalsFormat,
		Rounds:         tournament.Rules.Rounds,
		Duration:       tournament.Rules.Duration,
		Crossplatform:  tournament.Rules.Crossplatform,
		Stage:          tournament.Rules.Stage,
		Waiting:        tournament.Rules.Waiting,
	}
	dh.params.streamLobby = config.StreamLobby{
		Area:          tournament.Stream.Area,
		Language:      tournament.Stream.Language,
		Crossplatform: tournament.Stream.Crossplatform,
		Conn:          tournament.Stream.Conn,
		Passcode:      tournament.Stream.Passcode,
	}
	dh.params.rolesIdList = cfg.Discord.Roles
	// TODO: Change to another url
	dh.params.logo = "https://i.imgur.com/n9SG5IL.png"
	dh.params.debugChannelID = cfg.Discord.DebugChannelID

}

func (dh *Handler) Start(tourneyAuth *auth.AuthClient, conn *sql.DB, cfg config.ConfigMessenger, tournament config.ConfigTournament) error {
	session, err := discordgo.New(cfg.Discord.Token)
	if err != nil {
		return err
	}
	defer session.Close() //nolint:errcheck

	err = session.Open()
	if err != nil {
		return err
	}

	dh.InitBot(cfg, tourneyAuth.NamePlatform, tournament)
	ds := &DiscordSender{
		session: session,
		params:  dh.params,
	}
	dh.Ns.Messenger = ds

	registeredCommands, err := dh.InitCommands(dh.Auth.Config.ClientID, session, &tournament, &cfg)
	if err != nil {
		return err
	}

	log.Println("the bot is online!")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	log.Println("press Ctrl+C to exit")
	<-stop

	log.Println("removing commands...")
	if err := dh.deleteTourneyRole(session); err != nil {
		return err
	}

	for _, v := range registeredCommands {
		err := session.ApplicationCommandDelete(dh.Auth.Config.ClientID, cfg.Discord.GuildID, v.ID)
		log.Printf("%v\n", v.Name)
		if err != nil {
			fmt.Printf("Cannot delete '%v' command: %v\n", v.Name, err)
		}
	}
	log.Println("gracefully shutting down!")
	return nil
}
