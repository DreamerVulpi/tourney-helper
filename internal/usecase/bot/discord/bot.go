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

func (h *Handler) InitBot(cfg config.ConfigMessenger, activeTournamentPlatform string, tournament config.ConfigTournament) {
	h.tournamentPlatform = activeTournamentPlatform
	h.params.guildID = cfg.Discord.GuildID
	h.params.debugMode = cfg.DebugMode.Mode
	h.params.tournament = tournament
	h.params.rulesMatches = config.RulesMatches{
		StandardFormat: tournament.Rules.StandardFormat,
		FinalsFormat:   tournament.Rules.FinalsFormat,
		Rounds:         tournament.Rules.Rounds,
		Duration:       tournament.Rules.Duration,
		Crossplatform:  tournament.Rules.Crossplatform,
		Stage:          tournament.Rules.Stage,
		Waiting:        tournament.Rules.Waiting,
	}
	h.params.streamLobby = config.StreamLobby{
		Area:          tournament.Stream.Area,
		Language:      tournament.Stream.Language,
		Crossplatform: tournament.Stream.Crossplatform,
		Conn:          tournament.Stream.Conn,
		Passcode:      tournament.Stream.Passcode,
	}
	h.params.rolesIdList = cfg.Discord.Roles
	// TODO: Change to another url
	h.params.logo = "https://i.imgur.com/n9SG5IL.png"
	h.params.debugChannelID = cfg.Discord.DebugChannelID

}

func (h *Handler) Start(ctx context.Context, tourneyAuth *auth.AuthClient, conn *sql.DB, cfg config.ConfigMessenger, tournament config.ConfigTournament) error {
	h.mtx.Lock()
	defer h.mtx.Unlock()

	if h.session != nil {
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

	h.InitBot(cfg, tourneyAuth.NamePlatform, tournament)
	ds := &DiscordSender{
		session: session,
		params:  h.params,
	}
	h.Ns.Messenger = ds

	registeredCommands, err := h.InitCommands(h.Auth.Config.ClientID, session, &tournament, &cfg)
	if err != nil {
		session.Close()
		h.Ns.Messenger = nil
		return err
	}

	h.session = session
	h.registeredCmds = registeredCommands
	h.cfgCache = cfg

	log.Println("discord bot is online!")
	return nil
}

func (h *Handler) Stop() error {
	h.mtx.Lock()
	defer h.mtx.Unlock()

	// ДЕБАГ: Проверяем состояние самого Handler и его сессии
	log.Printf("[DEBUG STOP] Starting bot stop procedure. dh pointer: %p\n", h)
	if h == nil {
		return fmt.Errorf("handler is nil")
	}
	log.Printf("[DEBUG STOP] dh.session: %p, dh.Auth: %p, dh.Ns: %p\n", h.session, h.Auth, h.Ns)

	if h.session == nil {
		return fmt.Errorf("discord bot isn't running (session is nil)")
	}

	log.Println("removing discord commands and clearing up roles...")

	if err := h.deleteTourneyRole(h.session); err != nil {
		log.Printf("error deleting tourney role: %v\n", err)
	}

	// Проверяем наличие Auth и Config перед удалением команд
	if h.Auth != nil {
		log.Printf("[DEBUG STOP] dh.Auth.Config pointer: %p\n", h.Auth.Config)
		if h.Auth.Config != nil {
			log.Printf("[DEBUG STOP] Processing %d registered commands for deletion\n", len(h.registeredCmds))

			for _, v := range h.registeredCmds {
				if v == nil {
					log.Println("[DEBUG STOP] Found nil command in slice, skipping")
					continue
				}

				err := h.session.ApplicationCommandDelete(h.Auth.Config.ClientID, h.cfgCache.Discord.GuildID, v.ID)
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
	err := h.session.Close()

	if h.Ns != nil {
		log.Printf("[DEBUG STOP] Unlinking messenger from dh.Ns (%p)\n", h.Ns)
		h.Ns.Messenger = nil
	} else {
		log.Println("WARN | dh.Ns is nil, skipping messenger unlinking")
	}

	// Очищаем ресурсы сессии
	h.session = nil
	h.registeredCmds = nil

	log.Println("discord bot and notification system gracefully stopped!")
	return err
}
