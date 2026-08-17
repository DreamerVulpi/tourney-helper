package discord

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	entityLocale "github.com/dreamervulpi/tourney-helper/internal/entity/locale/bot"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

type DiscordSender struct {
	session       *discordgo.Session
	params        params
	defaultLocale entityLocale.Lang
	Metrics       *metrics.Collector
	searchLimiter chan struct{}
}

func (s *DiscordSender) GetPlatformMessengerName() string {
	return "Discord"
}

func (s *DiscordSender) IsLogChannelEnabled() bool {
	return s.params.debugChannelID != ""
}

func (h *Handler) StartSendMessages() {
	h.mtx.Lock()

	if h.cancel != nil {
		h.cancel()
	}

	ctx, cancel := context.WithCancel(context.Background())
	h.cancel = cancel
	h.mtx.Unlock()

	defer func() {
		cancel()
		h.mtx.Lock()
		h.cancel = nil
		h.mtx.Unlock()
	}()

	if err := h.Ns.Run(ctx); err != nil {
		log.Printf("sendingMessages | process failed: %v", err)
	}
}

func (s *DiscordSender) CreateDMChannel(ctx context.Context, messengerId string) (*string, error) {
	start := time.Now()
	channel, err := s.session.UserChannelCreate(messengerId)
	if err != nil {
		s.Metrics.RecordAPIRequest(err, time.Since(start))
		return nil, fmt.Errorf("SendNotification | error creating channel for %s: %w", messengerId, err)
	}
	s.Metrics.RecordAPIRequest(err, time.Since(start))
	return &channel.ID, nil
}

func (s *DiscordSender) SendMessage(ctx context.Context, targetID string, dmChannelID *string, set entitySender.SetData) (channelId string, err error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}

	if targetID == "" || targetID == "N/D" || len(targetID) == 0 || targetID == "0" {
		return "", fmt.Errorf("SendNotification | targetID is empty")
	}

	var channelID string
	log.Printf("dmChannelID(%v) != nil && *dmChannelID(%v) != 0", dmChannelID, dmChannelID)
	if dmChannelID != nil && *dmChannelID != "" {
		channelID = *dmChannelID
	} else {
		log.Printf("SendNotification | create channel for %s", targetID)
		channel, err := s.CreateDMChannel(ctx, targetID)
		if err != nil {
			return "", fmt.Errorf("SendNotification | error creating channel for %s: %w", targetID, err)
		}
		channelID = *channel
	}

	discordLocale, err := s.getMemberLocale(ctx, targetID)
	if err != nil {
		logger.Log(entityLogger.Debug, fmt.Sprintf("failed to get Discord locale: %v", err))
		discordLocale = ""
	}

	message, local, recipient := s.msgInvite(targetID, set, discordLocale)
	_, err = s.session.ChannelMessageSendComplex(channelID, &discordgo.MessageSend{
		Embed: message,
		Components: s.btnSupport(
			local.DonateField.Name,
			local.DonateField.URL,
			local.DonateField.Emoji,
			local.SubscribeField.Name,
			local.SubscribeField.URL,
			local.SubscribeField.Emoji,
		),
	})
	if err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("NotificationSystem | Can't sent message (targetID: %v): %v\n", targetID, err.Error()))
		if s.params.debugChannelID != "" {
			s.logMsgToDiscord(false, err.Error(), set, local, recipient.GameNickname)
		}
		return "", err
	}

	if s.params.debugChannelID != "" {
		s.logMsgToDiscord(true, "", set, local, recipient.GameNickname)
	}
	return channelID, nil
}

func (s *DiscordSender) cleanDiscordLogin(login string) string {
	res := strings.ReplaceAll(login, "@", "")
	if strings.Contains(res, "#") {
		return strings.Split(res, "#")[0]
	}
	return res
}

func (s *DiscordSender) getLocale(roles []string) string {
	for _, roleID := range roles {
		switch roleID {
		case s.params.rolesIdList.Ru:
			return "ru"
		case s.params.rolesIdList.En:
			return "en"
		}
	}
	return ""
}

func (s *DiscordSender) FindContactOfParticipant(ctx context.Context, p entitySender.Participant) (entitySender.Participant, error) {
	if err := ctx.Err(); err != nil {
		return entitySender.Participant{}, err
	}

	cleanNickname := s.cleanDiscordLogin(p.MessengerLogin)
	currentData := entitySender.Participant{
		MessengerID:             "",
		MessengerLogin:          cleanNickname,
		MessengerName:           s.GetPlatformMessengerName(),
		GameName:                p.GameName,
		TournamentPlatformName:  p.TournamentPlatformName,
		TournamentPlatformID:    p.TournamentPlatformID,
		TournamentPlatformLogin: p.TournamentPlatformLogin,
		GameNickname:            p.GameNickname,
		GameID:                  p.GameID,
		Locale:                  "",
		IsFound:                 false,
	}

	if p.MessengerLogin == "" || p.MessengerLogin == "N/D" {
		return currentData, fmt.Errorf("findContact | member %s not founded in guild (server)\n", p.GameNickname)
	}

	start := time.Now()
	members, err := s.session.GuildMembersSearch(s.params.guildID, cleanNickname, 1)
	if err != nil {
		s.Metrics.RecordAPIRequest(err, time.Since(start))
		return currentData, fmt.Errorf("findContact | member %s not found in guild (server): %w\n", cleanNickname, err)
	}

	if len(members) != 1 {
		s.Metrics.RecordAPIRequest(err, time.Since(start))
		return currentData, fmt.Errorf("findContact | member %s not found in guild (server)\n", cleanNickname)
	}
	s.Metrics.RecordAPIRequest(err, time.Since(start))
	targetMember := members[0]
	return entitySender.Participant{
		MessengerID:             targetMember.User.ID,
		MessengerLogin:          cleanNickname,
		MessengerName:           s.GetPlatformMessengerName(),
		GameName:                p.GameName,
		TournamentPlatformName:  p.TournamentPlatformName,
		TournamentPlatformID:    p.TournamentPlatformID,
		TournamentPlatformLogin: p.TournamentPlatformLogin,
		GameNickname:            p.GameNickname,
		GameID:                  p.GameID,
		Locale:                  s.getLocale(targetMember.Roles),
		IsFound:                 true,
	}, nil
}

func (s *DiscordSender) GetParticipantLocale(ctx context.Context, messengerID string) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}

	member, err := s.session.GuildMember(s.params.guildID, messengerID)
	if err != nil {
		return "", fmt.Errorf("getParticipantLocale | failed to get Discord member %s: %w", messengerID, err)
	}
	return s.getLocale(member.Roles), nil
}
