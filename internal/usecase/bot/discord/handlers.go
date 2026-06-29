package discord

import (
	"log"

	"github.com/bwmarrin/discordgo"
)

func (h *Handler) viewData(i *discordgo.InteractionCreate) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC RECOVER] во viewData: %v\n", r)
		}
	}()
	local := h.configResponseMsg(i.Locale.String())

	embed := []*discordgo.MessageEmbed{
		h.msgViewData(i.Locale.String()),
	}
	log.Println(embed)

	if err := h.responseEmbedMsgImmediate(i, embed); err != nil {
		log.Printf("viewData: %s\n err: %s\n", local.errorMsg.Respond, err)
	}
}

func (h *Handler) viewContact(i *discordgo.InteractionCreate) {
	local := h.configResponseMsg(i.Locale.String())

	_ = h.session.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
	})
	go func() {
		embed, err := h.getContact(i, local)
		if err != nil {
			log.Println("getContact business logic error:", err)
			return
		}

		if len(embed) > 0 {
			if err := h.responseEmbedMsgFollowup(i, embed); err != nil {
				log.Println("viewContact response error:", err)
			}
		}
	}()
}

func (h *Handler) roles(i *discordgo.InteractionCreate) {
	local := h.configResponseMsg(i.Locale.String())
	arg := i.ApplicationCommandData().Options[0].StringValue()

	embed := h.controlRole(arg)

	if err := h.responseEmbedMsgFollowup(i, embed); err != nil {
		log.Println("roles:", local.errorMsg.Respond)
	}
}
