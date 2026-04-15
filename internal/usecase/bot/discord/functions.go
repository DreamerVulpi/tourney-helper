package discord

import (
	"encoding/json"
	"fmt"

	"net/url"
	"strings"

	"regexp"

	"os"

	"github.com/bwmarrin/discordgo"
)

// method for start sending messages for players tournament
func (dh *DiscordHandler) processSending(s *discordgo.Session, i *discordgo.InteractionCreate, local responseLocale) error {
	// Check values ID server (guildID) and URL to tournament (slug)
	if dh.params.guildID != "" && dh.params.tournament.UrlToTournament != "" {
		if err := responseMsg(s, i, local.responseMsg.Starting); err != nil {
			return err
		}
		go dh.Process(s)
	}
	return fmt.Errorf("guildID = %v | slug = %v", dh.params.guildID, dh.params.tournament.UrlToTournament)
}

// parse URL string for get slug value
func (s *DiscordHandler) parseURL(i *discordgo.InteractionCreate, local responseLocale) ([]*discordgo.MessageEmbed, error) {
	embed := []*discordgo.MessageEmbed{}

	// parse string with URL
	u, err := url.Parse(i.ApplicationCommandData().Options[0].StringValue())
	if err != nil {
		embed = append(embed, msgEmbed("Error", []*discordgo.MessageEmbedField{
			{Name: "**Slug**", Value: local.errorMsg.Input},
		}, 0xe74c3c, &s.params)) //
		return embed, err
	}
	// separate URL to parts
	arg := strings.Split(u.Path, "/")

	// check URL on key words
	if len(arg) != 0 && arg[1] == "tournament" && arg[3] == "event" {
		s.params.tournament.UrlToTournament = arg[1] + "/" + arg[2] + "/" + arg[3] + "/" + arg[4]
		embed = append(embed, msgEmbed(local.vdMsg.Title, []*discordgo.MessageEmbedField{
			{Name: "**Slug**", Value: s.params.tournament.UrlToTournament},
		}, ColorSuccess, &s.params))
		return embed, nil
	}

	embed = append(embed, msgEmbed("Error", []*discordgo.MessageEmbedField{
		{Name: "**Slug**", Value: local.errorMsg.Input},
	}, ColorError, &s.params))
	return embed, fmt.Errorf("%s", local.errorMsg.Input)
}

func (s *DiscordHandler) getRuleMatchesData(i *discordgo.InteractionCreate) []*discordgo.MessageEmbed {
	args := i.ApplicationCommandData().Options
	s.params.rulesMatches.StandardFormat = int(args[0].IntValue())
	s.params.rulesMatches.FinalsFormat = int(args[1].IntValue())
	s.params.rulesMatches.Stage = args[2].StringValue()
	s.params.rulesMatches.Rounds = int(args[3].IntValue())
	s.params.rulesMatches.Duration = int(args[4].IntValue())
	s.params.rulesMatches.Crossplatform = args[5].BoolValue()

	// Saving values in template msgRuleMatches
	return []*discordgo.MessageEmbed{s.msgRuleMatches(i.Locale.String(), ColorSystem)}
}

func (s *DiscordHandler) getStreamLobbyData(i *discordgo.InteractionCreate, local responseLocale) ([]*discordgo.MessageEmbed, error) {
	args := i.ApplicationCommandData().Options
	embed := []*discordgo.MessageEmbed{}

	code := regexp.MustCompile(`[0-9]+`).FindAllString(args[4].StringValue(), -1)[0]
	if len(code) != 4 {
		embed = append(embed, msgEmbed("Error", []*discordgo.MessageEmbedField{
			{Name: local.vdMsg.MessageStreamHeader, Value: local.errorMsg.Input},
		}, ColorError, &s.params))
		return embed, fmt.Errorf("no 4 numbers in field")
	}

	s.params.streamLobby.Area = args[0].StringValue()
	s.params.streamLobby.Language = args[1].StringValue()
	s.params.streamLobby.Conn = args[2].StringValue()
	s.params.streamLobby.Crossplatform = args[3].BoolValue()
	s.params.streamLobby.Passcode = code

	// Saving values in template msgStreamLobby
	embed = append(embed, s.msgStreamLobby(i.Locale.String(), ColorStream))
	return embed, nil
}

func (s *DiscordHandler) getLogoTournamnentURL(i *discordgo.InteractionCreate, local responseLocale) []*discordgo.MessageEmbed {
	arg := i.ApplicationCommandData().Options[0].StringValue()
	s.params.tournament.Game.Name = arg

	return []*discordgo.MessageEmbed{msgEmbed(local.vdMsg.LogoTournament, []*discordgo.MessageEmbedField{
		{Name: "**Url**", Value: fmt.Sprintf("%v", s.params.tournament.Game.Name)},
	}, ColorSystem, &s.params)}
}

func (dh *DiscordHandler) readCommandEmbedJSON(s *discordgo.Session, i *discordgo.InteractionCreate, local responseLocale) ([]*discordgo.MessageEmbed, error) {
	errRespond := func(embed []*discordgo.MessageEmbed) []*discordgo.MessageEmbed {
		embed = append(embed, msgEmbed(local.vdMsg.Title, []*discordgo.MessageEmbedField{
			{Name: "", Value: local.errorMsg.NoData},
		}, ColorSystem, &dh.params))

		return embed
	}
	embed := []*discordgo.MessageEmbed{}

	cts, err := os.ReadFile("contactsEmbed.json")
	if err != nil {
		return errRespond(embed), err
	}
	if err := json.Unmarshal(cts, &dh.contacts.embedContacts); err != nil {
		return errRespond(embed), err
	}

	arg := i.ApplicationCommandData().Options[0].StringValue()
	switch strings.ToLower(arg) {
	case "any", "все":
		if err := responseMsg(s, i, local.responseMsg.InProcess); err != nil {
			return nil, err
		}
		for _, embedContact := range dh.contacts.embedContacts {
			if _, err := s.ChannelMessageSendEmbed(i.ChannelID, embedContact); err != nil {
				return errRespond(embed), err
			}
		}
		return nil, nil
	default:
		for _, embedContact := range dh.contacts.embedContacts {
			for _, field := range embedContact.Fields {
				// If argument from command == name from field which from json file
				if strings.EqualFold(strings.ToLower(arg), strings.ToLower(field.Name)) {
					var fields []*discordgo.MessageEmbedField
					fields = append(fields, &discordgo.MessageEmbedField{
						Name:  field.Name,
						Value: field.Value,
					})
					embed = append(embed, msgEmbed(local.vdMsg.Title, fields, ColorSystem, &dh.params))
					return embed, nil
				}
			}
		}
	}
	return errRespond(embed), fmt.Errorf("not finded player in json file: %v", arg)
}
