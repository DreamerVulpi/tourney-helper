package discord

import (
	"log"

	"github.com/bwmarrin/discordgo"
)

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
