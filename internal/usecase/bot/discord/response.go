package discord

import (
	"github.com/bwmarrin/discordgo"
)

// Response for instant command
func (h *Handler) responseEmbedMsgImmediate(i *discordgo.InteractionCreate, embed []*discordgo.MessageEmbed) error {
	return h.session.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: embed,
		},
	})
}

// Response for heavy command using gorutines
func (h *Handler) responseEmbedMsgFollowup(i *discordgo.InteractionCreate, embed []*discordgo.MessageEmbed) error {
	_, err := h.session.FollowupMessageCreate(i.Interaction, true, &discordgo.WebhookParams{
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
