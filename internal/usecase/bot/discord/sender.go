package discord

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/bwmarrin/discordgo"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

type DiscordSender struct {
	session *discordgo.Session
	params  params
}

func (s *DiscordSender) GetPlatformMessenagerName() string {
	return "Discord"
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
		channel, err := s.session.UserChannelCreate(targetID)
		if err != nil {
			return "", fmt.Errorf("SendNotification | error creating channel for %s: %w", targetID, err)
		}
		channelID = channel.ID
	}

	message, local, recipient := s.msgInvite(targetID, set)

	_, err = s.session.ChannelMessageSendEmbed(channelID, message)
	if err != nil {
		log.Printf("SendNotification | error sended DM: %v\n", err.Error())
		s.logMsgToDiscord(false, err.Error(), set, local, recipient.GameNickname)
		return "", err
	}

	s.logMsgToDiscord(true, "", set, local, recipient.GameNickname)
	return channelID, nil
}

func (s *DiscordSender) cleanDiscordLogin(login string) string {
	res := strings.ReplaceAll(login, "@", "")
	if strings.Contains(res, "#") {
		return strings.Split(res, "#")[0]
	}
	return res
}

func (s *DiscordSender) FindContactOfParticipant(ctx context.Context, p entitySender.Participant) (entitySender.Participant, error) {
	if err := ctx.Err(); err != nil {
		return entitySender.Participant{}, err
	}

	cleanNickname := s.cleanDiscordLogin(p.MessenagerLogin)
	var messengerID string
	var isFound bool
	currentLocale := "en"

	if p.MessenagerLogin == "" || p.MessenagerLogin == "N/D" {
		if s.params.debugMode {
			log.Printf("findContact | %s has no login, using debug mock", p.GameNickname)
			messengerID = "000000000000000000"
			isFound = true
			cleanNickname = "N/D"
		} else {
			return entitySender.Participant{}, fmt.Errorf("findContact | member %s not founded in guild (server)\n", cleanNickname)
		}
	} else {
		members, err := s.session.GuildMembersSearch(s.params.guildID, cleanNickname, 1)
		if err != nil || len(members) != 1 {
			if s.params.debugMode {
				messengerID = "000000000000000000"
				isFound = true
			} else {
				return entitySender.Participant{
					MessenagerID:            messengerID,
					MessenagerLogin:         cleanNickname,
					MessenagerName:          s.GetPlatformMessenagerName(),
					TournamentPlatformName:  p.TournamentPlatformName,
					TournamentPlatformID:    p.TournamentPlatformID,
					TournamentPlatformLogin: p.TournamentPlatformLogin,
					GameNickname:            p.GameNickname,
					GameName:                p.GameName,
					GameID:                  p.GameID,
					DmChannelId:             p.DmChannelId,
					Locale:                  currentLocale,
					IsFound:                 false,
				}, fmt.Errorf("findContact | member %s not founded in guild (server)\n", cleanNickname)
			}
		} else {
			targetMember := members[0]
			messengerID = targetMember.User.ID
			isFound = true
			for _, roleId := range targetMember.Roles {
				// TODO: Change reconize locale in future (More languages)
				if roleId == s.params.rolesIdList.Ru {
					currentLocale = "ru"
				}
			}
		}
	}

	return entitySender.Participant{
		MessenagerID:            messengerID,
		MessenagerLogin:         cleanNickname,
		MessenagerName:          s.GetPlatformMessenagerName(),
		GameName:                p.GameName,
		TournamentPlatformName:  p.TournamentPlatformName,
		TournamentPlatformID:    p.TournamentPlatformID,
		TournamentPlatformLogin: p.TournamentPlatformLogin,
		GameNickname:            p.GameNickname,
		GameID:                  p.GameID,
		Locale:                  currentLocale,
		IsFound:                 isFound,
	}, nil
}
