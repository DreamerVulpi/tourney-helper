package discord

import (
	"fmt"
	"log"
	"sync"

	"context"

	"database/sql"

	"github.com/bwmarrin/discordgo"
	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	entityLocale "github.com/dreamervulpi/tourney-helper/internal/entity/locale/bot"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
	usecaseSender "github.com/dreamervulpi/tourney-helper/internal/usecase/sender"
)

type params struct {
	tournament   config.NotificationSystem
	rulesMatches config.RulesMatches
	streamLobby  config.StreamLobby

	// Данные бота — теперь берутся из botCred в момент Start,
	// но кэшируются здесь, чтобы не тащить через весь Handler.
	guildID        string
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

	cfgCache config.ClientCredentials

	ReadyChan chan struct{}

	Metrics *metrics.Collector
}

func (h *Handler) InitBot(
	botCred config.ClientCredentials,
	activeTournamentPlatform string,
	tournament config.NotificationSystem,
	debugMode bool,
) {
	logger.Log(entityLogger.Debug, fmt.Sprintf(
		"[InitBot] called | botCred.Roles.Default=%q | botCred.GuildID=%q",
		botCred.Roles.Default, botCred.GuildID,
	))
	h.tournamentPlatform = activeTournamentPlatform

	h.params.guildID = botCred.GuildID
	h.params.debugChannelID = botCred.DebugChannelID
	h.params.rolesIdList = botCred.Roles
	h.params.debugMode = debugMode

	h.params.tournament = tournament

	h.params.rulesMatches = config.RulesMatches{
		StandardFormat: tournament.Rules.StandardFormat,
		FinalsFormat:   tournament.Rules.FinalsFormat,
		Rounds:         tournament.Rules.Rounds,
		Duration:       tournament.Rules.Duration,
		Stage:          tournament.Rules.Stage,
	}
	h.params.streamLobby = config.StreamLobby{
		Area:          tournament.Stream.Area,
		Language:      tournament.Stream.Language,
		Crossplatform: tournament.Stream.Crossplatform,
		Conn:          tournament.Stream.Conn,
		Passcode:      tournament.Stream.Passcode,
	}
	logger.Log(entityLogger.Debug, fmt.Sprintf(
		"[InitBot] after assign | h.params.rolesIdList.Default=%q",
		h.params.rolesIdList.Default,
	))
}

func (h *Handler) Start(
	ctx context.Context,
	tourneyAuth *auth.AuthClient,
	conn *sql.DB,
	botCred config.ClientCredentials,
	tourneyCred config.ClientCredentials,
	tournament config.NotificationSystem,
	settings config.SettingsApplicationCfg,
) error {
	h.mtx.Lock()
	if h.session != nil {
		h.mtx.Unlock()
		return fmt.Errorf("discord bot is already running")
	}
	h.mtx.Unlock()

	// --- 1. Валидация токена мессенджера ---
	if botCred.Token == "" {
		return fmt.Errorf("no token in active discord slot")
	}

	// --- 2. Создание сессии ---
	session, err := discordgo.New(botCred.Token)
	if err != nil {
		return err
	}

	if err := session.Open(); err != nil {
		return err
	}

	// --- 3. Инициализация данных бота ---
	h.InitBot(botCred, tourneyAuth.NamePlatform, tournament, settings.DebugMode)

	ds := &DiscordSender{
		session:    session,
		params:     h.params,
		Metrics:    h.Metrics,
		saveLocale: h.Ns.Db.EditParticipantLocale,
	}

	// --- 4. Локаль по умолчанию ---
	standart, errL := ds.reconizeLocale(ds.params.rolesIdList.Default)
	if errL != nil {
		ds.defaultLocale = entityLocale.En
	} else {
		ds.defaultLocale = standart
	}

	if ds.params.debugChannelID == "" {
		logger.Log(entityLogger.Info,
			"Notification System | Working without log channel...")
	}

	h.Ns.DeliveryMethod = ds

	// --- 5. Регистрация слэш-команд ---
	registeredCommands, err := h.InitCommands(
		botCred.ClientID,
		session,
		&tournament,
		&botCred,
	)
	if err != nil {
		session.Close()
		h.Ns.DeliveryMethod = nil
		return err
	}

	// --- 6. Сохранение состояния ---
	h.mtx.Lock()
	h.session = session
	h.registeredCmds = registeredCommands
	h.cfgCache = botCred
	h.mtx.Unlock()

	close(h.ReadyChan)
	return nil
}

func (h *Handler) Stop() error {
	if h == nil {
		return fmt.Errorf("handler is nil")
	}
	h.mtx.Lock()

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
	h.mtx.Unlock()

	logger.Log(entityLogger.Info, "Removing Discord commands and clearing up roles...")

	if err := h.deleteTourneyRole(session); err != nil {
		log.Printf("error deleting tourney role: %v\n", err)
	}

	// Check Auth & Config before delete commands
	if auth != nil {
		if auth.Config != nil {
			log.Printf("Processing %d registered commands for deletion\n", len(registeredCmds))

			for _, v := range registeredCmds {
				if v == nil {
					log.Println("Found nil command in slice, skipping")
					continue
				}

				err := session.ApplicationCommandDelete(auth.Config.ClientID, h.cfgCache.GuildID, v.ID)
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

	logger.Log(entityLogger.Info, "Closing Discord session...")
	err := session.Close()

	// Clear resourses
	h.mtx.Lock()
	h.session = nil
	h.registeredCmds = nil
	h.cancel = nil
	h.mtx.Unlock()

	logger.Log(entityLogger.Success, "Discord bot and notification system gracefully stopped!")
	return err
}
