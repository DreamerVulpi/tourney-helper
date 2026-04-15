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

func (_ *DiscordHandler) responseEmbedMsg(s *discordgo.Session, i *discordgo.InteractionCreate, embed []*discordgo.MessageEmbed) error {
	err := s.InteractionRespond(
		i.Interaction,
		&discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Embeds: embed,
			},
		},
	)
	return err
}

func (s *DiscordHandler) configResponseMsg(language string) responseLocale {
	local := s.typeLocale(language)

	var result responseLocale
	result.errorMsg = local.ErrorMessage
	result.vdMsg = local.ViewDataMessage
	result.invMsg = local.InviteMessage
	result.streamMsg = local.StreamLobbyMessage
	result.responseMsg = local.ResponseMessage

	rulesCrossplatform := local.InviteMessage.CrossplatformStatusTrue
	if !s.params.rulesMatches.Crossplatform {
		rulesCrossplatform = local.InviteMessage.CrossplatformStatusFalse
	}

	streamCrossplatform := local.StreamLobbyMessage.CrossplatformStatusTrue
	if !s.params.streamLobby.Crossplatform {
		streamCrossplatform = local.StreamLobbyMessage.CrossplatformStatusFalse
	}

	result.area = fieldArea(local, s.params.streamLobby.Area)
	result.conn = fieldConnection(local, s.params.streamLobby.Conn)
	result.lang = fieldLanguage(local, s.params.streamLobby.Language)
	result.crossplayLobby = streamCrossplatform
	result.crossplayRules = rulesCrossplatform

	return result
}
