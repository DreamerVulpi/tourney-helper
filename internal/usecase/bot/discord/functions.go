package discord

import (
	"fmt"

	"strings"

	"context"

	"github.com/bwmarrin/discordgo"
)

func escapeMarkdown(text string) string {
	return strings.NewReplacer(
		"_", "\\_",
		"*", "\\*",
		"~", "\\~",
		"`", "\\`",
	).Replace(text)
}

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

	// result, err := s.Ns.Db.GetParticipants(ctx, "Discord", platformName, gameName, limit, offset, nickname)
	result, err := h.Ns.Db.GetParticipants(ctx, "Discord", h.Ns.Data.GetPlatformTournamentName(), gameName, limit, offset, nickname)
	if err != nil {
		return embed, fmt.Errorf("failed to get participants from db: %w", err)
	}

	msgContactData, err := h.msgContactData(nickname, gameName, result, local)
	embed = append(embed, msgContactData[0])

	return embed, nil
}
