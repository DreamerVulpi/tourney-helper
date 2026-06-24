package discord

import (
	"fmt"
	"log"
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

	session        *discordgo.Session
	registeredCmds []*discordgo.ApplicationCommand
	cfgCache       config.ConfigMessenger
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

func (dh *Handler) Start(ctx context.Context, tourneyAuth *auth.AuthClient, conn *sql.DB, cfg config.ConfigMessenger, tournament config.ConfigTournament) error {
	dh.mtx.Lock()
	defer dh.mtx.Unlock()

	if dh.session != nil {
		return fmt.Errorf("discord bot is already running")
	}

	session, err := discordgo.New(cfg.Discord.Token)
	if err != nil {
		return err
	}

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
		session.Close()
		dh.Ns.Messenger = nil
		return err
	}

	dh.session = session
	dh.registeredCmds = registeredCommands
	dh.cfgCache = cfg

	log.Println("discord bot is online!")
	return nil
}

func (dh *Handler) Stop() error {
	dh.mtx.Lock()
	defer dh.mtx.Unlock()

	// ДЕБАГ: Проверяем состояние самого Handler и его сессии
	log.Printf("[DEBUG STOP] Starting bot stop procedure. dh pointer: %p\n", dh)
	if dh == nil {
		return fmt.Errorf("handler is nil")
	}
	log.Printf("[DEBUG STOP] dh.session: %p, dh.Auth: %p, dh.Ns: %p\n", dh.session, dh.Auth, dh.Ns)

	if dh.session == nil {
		return fmt.Errorf("discord bot isn't running (session is nil)")
	}

	log.Println("removing discord commands and clearing up roles...")

	if err := dh.deleteTourneyRole(dh.session); err != nil {
		log.Printf("error deleting tourney role: %v\n", err)
	}

	// Проверяем наличие Auth и Config перед удалением команд
	if dh.Auth != nil {
		log.Printf("[DEBUG STOP] dh.Auth.Config pointer: %p\n", dh.Auth.Config)
		if dh.Auth.Config != nil {
			log.Printf("[DEBUG STOP] Processing %d registered commands for deletion\n", len(dh.registeredCmds))

			for _, v := range dh.registeredCmds {
				if v == nil {
					log.Println("[DEBUG STOP] Found nil command in slice, skipping")
					continue
				}

				err := dh.session.ApplicationCommandDelete(dh.Auth.Config.ClientID, dh.cfgCache.Discord.GuildID, v.ID)
				if err != nil {
					log.Printf("cannot delete '%v' command: %v\n", v.Name, err)
				} else {
					log.Printf("[DEBUG STOP] Successfully deleted command: %s\n", v.Name)
				}
			}
		} else {
			log.Println("WARN | dh.Auth.Config is nil, skipping command deletion")
		}
	} else {
		log.Println("WARN | dh.Auth is nil, skipping command deletion")
	}

	log.Println("[DEBUG STOP] Closing discord session...")
	err := dh.session.Close()

	if dh.Ns != nil {
		log.Printf("[DEBUG STOP] Unlinking messenger from dh.Ns (%p)\n", dh.Ns)
		dh.Ns.Messenger = nil
	} else {
		log.Println("WARN | dh.Ns is nil, skipping messenger unlinking")
	}

	// Очищаем ресурсы сессии
	dh.session = nil
	dh.registeredCmds = nil

	log.Println("discord bot and notification system gracefully stopped!")
	return err
}
