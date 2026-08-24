package discord

import (
	"fmt"
	"time"

	"strings"

	"context"

	"github.com/bwmarrin/discordgo"
	entityLocale "github.com/dreamervulpi/tourney-helper/internal/entity/locale/bot"
)

func (s *DiscordSender) reconizeLocale(locale string) (entityLocale.Lang, error) {
	switch locale {
	case string(entityLocale.LocaleRu):
		return entityLocale.Ru, nil
	case string(entityLocale.LocaleEn):
		return entityLocale.En, nil
	}
	return entityLocale.Lang{}, fmt.Errorf("unknown locale: %v", locale)
}

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

func (s *DiscordSender) getMemberLocale(ctx context.Context, targetID string) (string, error) {
	start := time.Now()
	if err := ctx.Err(); err != nil {
		return "", err
	}

	member, err := s.session.GuildMember(s.params.guildID, targetID)
	if err != nil {
		return "", fmt.Errorf("failed to get Discord member %s: %w", targetID, err)
	}
	s.Metrics.RecordAPIRequest(err, time.Since(start))
	return s.getLocale(member.Roles), nil
}
