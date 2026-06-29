package discord

import (
	"log"

	"github.com/bwmarrin/discordgo"
)

func (h *Handler) controlRole(arg string) []*discordgo.MessageEmbed {
	var embed []*discordgo.MessageEmbed
	if len(h.contacts.contacts) != 0 {
		if arg == "give" {
			for _, usr := range h.contacts.contacts {
				if usr.MessenagerID == "N/D" {
					continue
				}
				err := h.session.GuildMemberRoleAdd(h.params.guildID, usr.MessenagerID, h.contacts.tourneyRole.ID)
				if err != nil {
					log.Println(err.Error())
				}
			}
		} else {
			for _, usr := range h.contacts.contacts {
				if usr.MessenagerID == "N/D" {
					continue
				}
				err := h.session.GuildMemberRoleRemove(h.params.guildID, usr.MessenagerID, h.contacts.tourneyRole.ID)
				if err != nil {
					log.Println(err.Error())
				}
			}
		}
		embed = append(embed, msgEmbed("Roles", []*discordgo.MessageEmbedField{
			{Name: "Success!"},
		}, 0x2ecc71, &h.params))
	} else {
		embed = append(embed, msgEmbed("Roles", []*discordgo.MessageEmbedField{
			{Name: "Error: Can't work with roles by commands", Value: "CSV file with data isn't loaded. Load file and restart bot."},
		}, 0xe74c3c, &h.params))
	}
	return embed
}

func (h *Handler) createTourneyRole(session *discordgo.Session) error {
	rolesServer, err := session.GuildRoles(h.params.guildID)
	if err != nil {
		return err
	}

	var checker bool

	// check available role in guild (server) discord
	for _, r := range rolesServer {
		if r.Name == "Tourney Role" {
			checker = true
			h.contacts.tourneyRole = r
			log.Println("createTourneyRole | Finded role in server! Saved to program")
		}
	}

	if !checker {
		color := 16711680
		hoist := true
		mentionable := true
		var prms int64 = 0x0000000000000800 | 0x0000000000000400

		rslt, err := session.GuildRoleCreate(h.params.guildID, &discordgo.RoleParams{
			Name:        "Tourney Role",
			Color:       &color,
			Hoist:       &hoist,
			Mentionable: &mentionable,
			Permissions: &prms,
		})

		if err != nil {
			log.Println(err.Error())
		}

		h.contacts.tourneyRole = rslt

		log.Println("Tourney role successfuly created in server!")
	}

	return nil
}

func (h *Handler) deleteTourneyRole(session *discordgo.Session) error {
	rolesServer, err := session.GuildRoles(h.params.guildID)
	if err != nil {
		return err
	}

	// check available role in guild (server) discord
	for _, r := range rolesServer {
		if r.Name == "Tourney Role" {
			err := session.GuildRoleDelete(h.params.guildID, r.ID)
			if err != nil {
				return err
			}
			log.Println("Tourney role successfuly deleted from server!")
			break
		}
	}

	return nil
}
