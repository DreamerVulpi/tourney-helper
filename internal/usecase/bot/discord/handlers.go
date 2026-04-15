package discord

import (
	"log"

	"github.com/bwmarrin/discordgo"
)

func (dh *DiscordHandler) viewData(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())

	embed := []*discordgo.MessageEmbed{
		dh.msgViewData(i.Locale.String()),
	}

	if err := dh.responseEmbedMsg(s, i, embed); err != nil {
		log.Println("viewData:", local.errorMsg.Respond)
	}
}

func (dh *DiscordHandler) startSending(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())
	if err := dh.processSending(s, i, local); err != nil {
		log.Println("processSending:", err)
	}
}

func (dh *DiscordHandler) stopSending(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())

	go func() {
		if err := responseMsg(s, i, local.responseMsg.Stopping); err != nil {
			log.Println("Error sending interaction response:", err)
		}
	}()

	dh.mtx.Lock()
	if dh.cancel != nil {
		dh.cancel()
		dh.cancel = nil
		log.Println("SUCCESS: Cancel function executed")
	}
	dh.mtx.Unlock()

	_, err := s.ChannelMessageSend(i.ChannelID, local.responseMsg.Stopped)
	if err != nil {
		log.Println("Error sending final message:", err)
	}
}

func (dh *DiscordHandler) setEvent(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())
	embed, err := dh.parseURL(i, local)
	if err != nil {
		log.Println("parseURL:", err)
	}

	if err := dh.responseEmbedMsg(s, i, embed); err != nil {
		log.Println("setEvent:", local.errorMsg.Respond)
	}
}

func (dh *DiscordHandler) editRuleMatches(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())

	embed := dh.getRuleMatchesData(i)
	if err := dh.responseEmbedMsg(s, i, embed); err != nil {
		log.Println("editRuleMatches:", local.errorMsg.Respond)
	}
}

func (dh *DiscordHandler) editStreamLobby(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())

	embed, err := dh.getStreamLobbyData(i, local)
	if err != nil {
		log.Println("getStreamLobbyData:", err)
	}

	if err := dh.responseEmbedMsg(s, i, embed); err != nil {
		log.Println("editStreamLobby:", local.errorMsg.Respond)
	}
}

func (dh *DiscordHandler) editLogoTournament(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())

	embed := dh.getLogoTournamnentURL(i, local)
	if err := dh.responseEmbedMsg(s, i, embed); err != nil {
		log.Println("editLogoTournament:", local.errorMsg.Respond)
	}
}

func (dh *DiscordHandler) viewContacts(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())

	go func() {
		embed, err := dh.readCommandEmbedJSON(s, i, local)
		if err != nil {
			log.Println("readCommandEmbedJSON:", err)
		}
		if len(embed) > 0 {
			if err := dh.responseEmbedMsg(s, i, embed); err != nil {
				log.Println("viewContacts response error:", err)
			}
		}
	}()
}

func (dh *DiscordHandler) roles(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := dh.configResponseMsg(i.Locale.String())
	arg := i.ApplicationCommandData().Options[0].StringValue()

	embed := dh.controlRole(s, arg)

	if err := dh.responseEmbedMsg(s, i, embed); err != nil {
		log.Println("roles:", local.errorMsg.Respond)
	}
}
