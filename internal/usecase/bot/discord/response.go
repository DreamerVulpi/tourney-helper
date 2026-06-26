package discord

import (
	"errors"

	"github.com/bwmarrin/discordgo"
)

func responseMsg(s *discordgo.Session, i *discordgo.InteractionCreate, text string) error {
	err := s.InteractionRespond(
		i.Interaction,
		&discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: text,
			},
		},
	)
	if err != nil {
		return errors.New("response: can't respond on message")
	}
	return nil
}

// Response for instant command: /check
func (dh *Handler) responseEmbedMsgImmediate(s *discordgo.Session, i *discordgo.InteractionCreate, embed []*discordgo.MessageEmbed) error {
	return s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: embed,
		},
	})
}

// Response for heavy command using gorutines
func (dh *Handler) responseEmbedMsgFollowup(s *discordgo.Session, i *discordgo.InteractionCreate, embed []*discordgo.MessageEmbed) error {
	_, err := s.FollowupMessageCreate(i.Interaction, true, &discordgo.WebhookParams{
		Embeds: embed,
	})
	return err
}

func (h *Handler) configResponseMsg(language string) responseLocale {
	local := h.typeLocale(language)

	var result responseLocale
	result.errorMsg = local.ErrorMessage
	result.vdMsg = local.ViewDataMessage
	result.invMsg = local.InviteMessage
	result.streamMsg = local.StreamLobbyMessage
	result.responseMsg = local.ResponseMessage
	result.contactMsg = local.ContactMessage

	rulesCrossplatform := local.InviteMessage.CrossplatformStatusTrue
	if !h.params.rulesMatches.Crossplatform {
		rulesCrossplatform = local.InviteMessage.CrossplatformStatusFalse
	}

	streamCrossplatform := local.StreamLobbyMessage.CrossplatformStatusTrue
	if !h.params.streamLobby.Crossplatform {
		streamCrossplatform = local.StreamLobbyMessage.CrossplatformStatusFalse
	}

	result.area = fieldArea(local, h.params.streamLobby.Area)
	result.conn = fieldConnection(local, h.params.streamLobby.Conn)
	result.lang = fieldLanguage(local, h.params.streamLobby.Language)
	result.crossplayLobby = streamCrossplatform
	result.crossplayRules = rulesCrossplatform

	return result
}
