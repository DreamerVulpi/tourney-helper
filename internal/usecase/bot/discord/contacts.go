package discord

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/bwmarrin/discordgo"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

type preparedContacts struct {
	contacts      map[string]entitySender.Participant
	embedContacts []*discordgo.MessageEmbed
	tourneyRole   *discordgo.Role
}

func (dh *Handler) SetContacts(c map[string]entitySender.Participant) {
	dh.mtx.Lock()
	defer dh.mtx.Unlock()
	dh.contacts.contacts = c
}

// Search users in server (Guild) discord from CSV file
func (dh *Handler) prepareContacts(ctx context.Context, s *discordgo.Session) error {
	contacts, err := os.ReadFile("contacts.json")
	if err != nil {
		log.Println("Prepare contacts from CSV...")
		for nickname, dc := range dh.contacts.contacts {
			time.Sleep(1 * time.Second)
			contact := entitySender.Participant{
				MessenagerID:           "",
				MessenagerLogin:        dc.MessenagerLogin,
				MessenagerName:         dh.Ns.Messenger.GetPlatformMessenagerName(),
				GameID:                 dc.GameID,
				GameName:               dc.GameName,
				GameNickname:           dc.GameNickname,
				TournamentPlatformName: dc.TournamentPlatformName,
				TournamentPlatformID:   dc.TournamentPlatformID,
				Locale:                 dc.Locale,
			}

			usr, err := dh.Ns.Messenger.FindContactOfParticipant(ctx, contact)
			if err != nil {
				dh.contacts.contacts[nickname] = contact
				log.Printf("can't find player: %v\n error: %v\n", nickname, err.Error())
				continue
			}
			contact.MessenagerID = usr.MessenagerID
			dh.contacts.contacts[nickname] = contact

			time.Sleep(1 * time.Second)
			if usr.MessenagerID != "000000000000000000" && usr.MessenagerID != "" {
				err = s.GuildMemberRoleAdd(dh.params.guildID, usr.MessenagerID, dh.contacts.tourneyRole.ID)
				if err != nil {
					log.Printf("prepareContacts | discord API Error (RoleAdd) for %v: %v", nickname, err)
					continue
				}
			} else {
				log.Printf("prepareContacts | skip roleAdd for %v: user not on server (Mock ID used)\n", nickname)
			}
		}

		file, err := json.MarshalIndent(dh.contacts.contacts, "", " ")
		if err != nil {
			log.Println(err.Error())
		}

		err = os.WriteFile("contacts.json", file, 0644)
		if err != nil {
			log.Println(err.Error())
		}

		log.Println("Done!")
	} else {
		err := json.Unmarshal(contacts, &dh.contacts.contacts)
		if err != nil {
			return err
		}

		log.Println("Loaded contact.json file")
	}

	contactsEmbed, err := os.ReadFile("contactsEmbed.json")
	if err != nil {
		if len(dh.contacts.contacts) != 0 {
			log.Println("Generate contact.json file...")

			sliceMessages := []*discordgo.MessageEmbed{}
			fields := []*discordgo.MessageEmbedField{}

			for nickname, dc := range dh.contacts.contacts {
				usr, err := dh.Ns.Messenger.FindContactOfParticipant(ctx, dc)
				time.Sleep(1 * time.Second)
				field := &discordgo.MessageEmbedField{
					Name:   nickname,
					Inline: false,
				}

				if err != nil {
					field.Value = fmt.Sprintf("__Discord:__\n```%v```__GameID:__\n```%v```", dc.MessenagerLogin, dc.GameID)
				} else {
					field.Value = fmt.Sprintf("__Discord:__\n<@%v>\n__GameID:__\n```%v```", usr.MessenagerID, dc.GameID)
				}

				fields = append(fields, field)

				if len(fields) == 25 {
					sliceMessages = append(sliceMessages, msgEmbed("", fields, ColorSystem, &dh.params))
					fields = []*discordgo.MessageEmbedField{}
				}
			}

			if len(fields) > 0 {
				sliceMessages = append(sliceMessages, msgEmbed("", fields, ColorSystem, &dh.params))
			}

			dh.contacts.embedContacts = sliceMessages

			file, err := json.MarshalIndent(dh.contacts.embedContacts, "", " ")
			if err != nil {
				return err
			}

			err = os.WriteFile("contactsEmbed.json", file, 0644)
			if err != nil {
				return err
			}
		} else {
			log.Println("Error: List discord contacts is empty")
		}
	} else {
		err := json.Unmarshal(contactsEmbed, &dh.contacts.embedContacts)
		if err != nil {
			return err
		}
		log.Println("Loaded contactEmbed.json file")
	}
	return nil
}
