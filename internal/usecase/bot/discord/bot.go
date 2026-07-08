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
	loggerEntity "github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/logger"
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
	tourneyRole        *discordgo.Role
	cancel             context.CancelFunc
	mtx                sync.Mutex
	params             params

	session        *discordgo.Session
	registeredCmds []*discordgo.ApplicationCommand
	cfgCache       config.ConfigMessenger
	ReadyChan      chan struct{}
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

	if h.session != nil {
		h.mtx.Unlock()
		return fmt.Errorf("discord bot is already running")
	}
	h.ReadyChan = make(chan struct{})
	h.mtx.Unlock()

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

	h.mtx.Lock()
	h.session = session
	h.registeredCmds = registeredCommands
	h.cfgCache = cfg
	h.mtx.Unlock()

	log.Println("discord bot is online!")
	close(h.ReadyChan)
	return nil
}

func (h *Handler) Stop() error {
	logger.Log(loggerEntity.Info, fmt.Sprintf("Starting bot stop procedure. dh pointer: %p\n", h))
	if h == nil {
		return fmt.Errorf("handler is nil")
	}
	h.mtx.Lock()
	log.Printf("dh.session: %p, dh.Auth: %p, dh.Ns: %p\n", h.session, h.Auth, h.Ns)

	if h.cancel != nil {
		h.cancel()
	}

	if h.session == nil {
		h.mtx.Unlock()
		return fmt.Errorf("discord bot isn't running (session is nil)")
	}

	session := h.session
	registeredCmds := h.registeredCmds
	auth := h.Auth
	ns := h.Ns
	h.mtx.Unlock()

	logger.Log(loggerEntity.Info, "Removing Discord commands and clearing up roles...")

	if err := h.deleteTourneyRole(session); err != nil {
		log.Printf("error deleting tourney role: %v\n", err)
	}

	// Проверяем наличие Auth и Config перед удалением команд
	if auth != nil {
		log.Printf("auth.Config pointer: %p\n", auth.Config)
		if auth.Config != nil {
			log.Printf("Processing %d registered commands for deletion\n", len(registeredCmds))

			for _, v := range registeredCmds {
				if v == nil {
					log.Println("Found nil command in slice, skipping")
					continue
				}

				err := session.ApplicationCommandDelete(auth.Config.ClientID, h.cfgCache.Discord.GuildID, v.ID)
				if err != nil {
					log.Printf("cannot delete '%v' command: %v\n", v.Name, err)
				} else {
					log.Printf(" Successfully deleted command: %s\n", v.Name)
				}
			}
		} else {
			log.Println("dh.Auth.Config is nil, skipping command deleteion")
		}
	} else {
		log.Println("dh.Auth is nil, skipping command deleteion")
	}

	logger.Log(loggerEntity.Info, "Closing Discord session...")
	err := session.Close()

	if ns != nil {
		log.Printf("Unlinking messenger from dh.Ns (%p)\n", ns)
		ns.Messenger = nil
	} else {
		log.Println("dh.Ns is nil, skipping messenger unlinking")
	}

	// Очищаем ресурсы сессии
	h.mtx.Lock()
	h.session = nil
	h.registeredCmds = nil
	h.cancel = nil
	h.mtx.Unlock()

	logger.Log(loggerEntity.Success, "Discord bot and notification system gracefully stopped!")
	return err
}
