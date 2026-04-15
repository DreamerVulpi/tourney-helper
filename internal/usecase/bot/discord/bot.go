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
	"github.com/dreamervulpi/tourneyBot/internal/db/repo"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	usecaseDB "github.com/dreamervulpi/tourneyBot/internal/usecase/db"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/sender"
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

type DiscordHandler struct {
	auth               *auth.AuthClient
	ns                 usecaseSender.NotificationSystem
	tournamentPlatform string
	contacts           preparedContacts
	cancel             context.CancelFunc
	mtx                sync.Mutex
	params             params
}

func (dh *DiscordHandler) InitBot(dsAuth *auth.AuthClient, cfg config.ConfigMessenger, activeTournamentPlatform string, tournament config.ConfigTournament) {
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
	dh.params.logo = "https://i.imgur.com/n9SG5IL.png"
	dh.params.debugChannelID = cfg.Discord.DebugChannelID

}

func (dh *DiscordHandler) Start(dsAuth *auth.AuthClient, tourneyAuth *auth.AuthClient, conn *sql.DB, cfg config.ConfigMessenger, tournament config.ConfigTournament) error {
	session, err := discordgo.New(cfg.Discord.Token)
	if err != nil {
		return err
	}
	defer session.Close() //nolint:errcheck

	err = session.Open()
	if err != nil {
		return err
	}

	dh.InitBot(dsAuth, cfg, tourneyAuth.NamePlatform, tournament)
	ctx := context.Background()

	ds := &DiscordSender{
		session:       session,
		params:        dh.params,
		participantUC: usecaseDB.Participant{Repo: &repo.Participants{Conn: conn}},
	}

	adapter, err := dh.GetAdapter(tourneyAuth)
	if err != nil {
		return err
	}

	ns := sender.NotificationSystem{
		Data:          adapter,
		Messenger:     ds,
		ParticipantUC: usecaseDB.Participant{Repo: &repo.Participants{Conn: conn}},
		SentSetUC:     usecaseDB.SentSet{Repo: &repo.SentSet{Conn: conn}},
		DebugMode:     cfg.DebugMode.Mode,
	}

	meTourneyPlatform, err := ns.Data.GetMe(tourneyAuth)
	if err != nil {
		return err
	}
	if len(meTourneyPlatform.ID) <= 0 {
		return fmt.Errorf("Failed get ID")
	}
	log.Println(meTourneyPlatform.ID)

	if cfg.DebugMode.Mode {
		meDiscordPlatform, err := dsAuth.GetDiscordMe(ctx)
		if err != nil {
			log.Printf("InitBot | Failed to get debug user: %v", err)
		} else {
			ns.TestContact = entitySender.Participant{
				MessenagerID:    meDiscordPlatform.ID,
				MessenagerLogin: meDiscordPlatform.Username,
				Locales:         []string{"ru"},
			}
			log.Printf("InitBot | Debug mode ON. Test contact set to: %s", meDiscordPlatform.Username)
		}
	}

	dh.auth = dsAuth
	dh.ns = ns

	registeredCommands, err := dh.InitCommands(dsAuth.Config.ClientID, session, &tournament, &cfg)
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
		err := session.ApplicationCommandDelete(dsAuth.Config.ClientID, cfg.Discord.GuildID, v.ID)
		log.Printf("%v\n", v.Name)
		if err != nil {
			fmt.Printf("Cannot delete '%v' command: %v\n", v.Name, err)
		}
	}
	log.Println("gracefully shutting down!")
	return nil
}
