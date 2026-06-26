package discord

import (
	"log"

	"github.com/bwmarrin/discordgo"
)

func (h *Handler) viewData(s *discordgo.Session, i *discordgo.InteractionCreate) {
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

	if err := h.responseEmbedMsgImmediate(s, i, embed); err != nil {
		log.Printf("viewData: %s\n err: %s\n", local.errorMsg.Respond, err)
	}
}

// TODO: Change to actual - request to database
func (h *Handler) viewContact(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := h.configResponseMsg(i.Locale.String())

	_ = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
	})
	go func() {
		embed, err := h.getContact(i, local)
		if err != nil {
			log.Println("getContact business logic error:", err)
			return
		}

		if len(embed) > 0 {
			if err := h.responseEmbedMsgFollowup(s, i, embed); err != nil {
				log.Println("viewContact response error:", err)
			}
		}
	}()
}

func (h *Handler) roles(s *discordgo.Session, i *discordgo.InteractionCreate) {
	local := h.configResponseMsg(i.Locale.String())
	arg := i.ApplicationCommandData().Options[0].StringValue()

	embed := h.controlRole(s, arg)

	if err := h.responseEmbedMsgFollowup(s, i, embed); err != nil {
		log.Println("roles:", local.errorMsg.Respond)
	}
}
