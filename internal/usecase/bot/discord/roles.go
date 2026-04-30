package discord

import (
	"log"

	"github.com/bwmarrin/discordgo"
)

func (dh *Handler) controlRole(s *discordgo.Session, arg string) []*discordgo.MessageEmbed {
	var embed []*discordgo.MessageEmbed
	if len(dh.contacts.contacts) != 0 {
		if arg == "give" {
			for _, usr := range dh.contacts.contacts {
				if usr.MessenagerID == "N/D" {
					continue
				}
				err := s.GuildMemberRoleAdd(dh.params.guildID, usr.MessenagerID, dh.contacts.tourneyRole.ID)
				if err != nil {
					log.Println(err.Error())
				}
			}
		} else {
			for _, usr := range dh.contacts.contacts {
				if usr.MessenagerID == "N/D" {
					continue
				}
				err := s.GuildMemberRoleRemove(dh.params.guildID, usr.MessenagerID, dh.contacts.tourneyRole.ID)
				if err != nil {
					log.Println(err.Error())
				}
			}
		}
		embed = append(embed, msgEmbed("Roles", []*discordgo.MessageEmbedField{
			{Name: "Success!"},
		}, 0x2ecc71, &dh.params))
	} else {
		embed = append(embed, msgEmbed("Roles", []*discordgo.MessageEmbedField{
			{Name: "Error: Can't work with roles by commands", Value: "CSV file with data isn't loaded. Load file and restart bot."},
		}, 0xe74c3c, &dh.params))
	}
	return embed
}

func (s *Handler) createTourneyRole(session *discordgo.Session) error {
	rolesServer, err := session.GuildRoles(s.params.guildID)
	if err != nil {
		return err
	}

	var checker bool

	// check available role in guild (server) discord
	for _, r := range rolesServer {
		if r.Name == "Tourney Role" {
			checker = true
			s.contacts.tourneyRole = r
			log.Println("createTourneyRole | Finded role in server! Saved to program")
		}
	}

	if !checker {
		color := 16711680
		hoist := true
		mentionable := true
		var prms int64 = 0x0000000000000800 | 0x0000000000000400

		rslt, err := session.GuildRoleCreate(s.params.guildID, &discordgo.RoleParams{
			Name:        "Tourney Role",
			Color:       &color,
			Hoist:       &hoist,
			Mentionable: &mentionable,
			Permissions: &prms,
		})

		if err != nil {
			log.Println(err.Error())
		}

		s.contacts.tourneyRole = rslt

		log.Println("Tourney role successfuly created in server!")
	}

	return nil
}

func (s *Handler) deleteTourneyRole(session *discordgo.Session) error {
	rolesServer, err := session.GuildRoles(s.params.guildID)
	if err != nil {
		return err
	}

	// check available role in guild (server) discord
	for _, r := range rolesServer {
		if r.Name == "Tourney Role" {
			err := session.GuildRoleDelete(s.params.guildID, r.ID)
			if err != nil {
				return err
			}
			log.Println("Tourney role successfuly deleted from server!")
			break
		}
	}

	return nil
}
