package discord

import (
	"github.com/bwmarrin/discordgo"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

type preparedContacts struct {
	contacts      map[string]entitySender.Participant
	embedContacts []*discordgo.MessageEmbed
	tourneyRole   *discordgo.Role
}

func (h *Handler) SetContacts(c map[string]entitySender.Participant) {
	h.mtx.Lock()
	defer h.mtx.Unlock()
	h.contacts.contacts = c
}
