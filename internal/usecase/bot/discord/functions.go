package discord

import (
	"fmt"

	"strings"

	"context"

	"github.com/bwmarrin/discordgo"
	"github.com/labstack/gommon/log"
)

func escapeMarkdown(text string) string {
	return strings.NewReplacer(
		"_", "\\_",
		"*", "\\*",
		"~", "\\~",
		"`", "\\`",
	).Replace(text)
}

// method for start sending messages for players tournament
func (h *Handler) processSending(s *discordgo.Session, i *discordgo.InteractionCreate, local responseLocale) error {
	// Check values ID server (guildID) and URL to tournament (slug)
	if h.params.guildID != "" && h.params.tournament.UrlToTournament != "" {
		if err := responseMsg(s, i, local.responseMsg.Starting); err != nil {
			return err
		}
		go h.Process()
	}
	return fmt.Errorf("guildID = %v | slug = %v", h.params.guildID, h.params.tournament.UrlToTournament)
}

// TODO: ADD SUPPORT TOURNEY MULTIPLATFORMING
func (h *Handler) getContact(i *discordgo.InteractionCreate, local responseLocale) ([]*discordgo.MessageEmbed, error) {
	embed := []*discordgo.MessageEmbed{}
	ctx := context.Background()

	var nickname string
	var gameName string
	// var platformName string

	for _, option := range i.ApplicationCommandData().Options {
		switch option.Name {
		case "nickname":
			nickname = option.StringValue()
		case "game":
			gameName = option.StringValue()
		}
		// case "platform":
		// 	platformName = option.StringValue()
	}

	// if nickname == "" || gameName == "" || platformName == "" {
	if nickname == "" || gameName == "" {
		return embed, fmt.Errorf("nickname option is empty")
	}

	limit := 1
	offset := 0

	log.Printf("[DEBUG DB REQ] Messenger: Discord, Platform: '%s', Game: '%s', Limit: %d, Offset: %d, Search: '%s'\n",
		h.Ns.Data.GetPlatformTournamentName(), gameName, limit, offset, nickname)
	// result, err := s.Ns.Db.GetParticipants(ctx, "Discord", platformName, gameName, limit, offset, nickname)
	result, err := h.Ns.Db.GetParticipants(ctx, "Discord", h.Ns.Data.GetPlatformTournamentName(), gameName, limit, offset, nickname)
	if err != nil {
		return embed, fmt.Errorf("failed to get participants from db: %w", err)
	}

	msgContactData, err := h.msgContactData(nickname, gameName, result, local)
	embed = append(embed, msgContactData[0])

	return embed, nil
}
