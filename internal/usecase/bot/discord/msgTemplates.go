package discord

import (
	"fmt"
	"log"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entityLocale "github.com/dreamervulpi/tourneyBot/internal/entity/locale/bot"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

const (
	ColorDefault = 0x3498db // Blue: standard matches and information messages (Hex: #3498db)
	ColorStream  = 0x9b59b6 // Purple: matches on stream (Hex: #9b59b6)
	ColorFinal   = 0xe74c3c // Red: final stage tournament (Hex: #e74c3c)
	ColorSuccess = 0x2ecc71 // Green: success status (Hex: #2ecc71)
	ColorError   = 0x960018 // Dark-red: errors (Hex: #960018)
	ColorSystem  = 0x9c9c9c // Grey: check data and log (Hex: #9c9c9c)
)

type responseLocale struct {
	errorMsg       entityLocale.ErrorMessage
	vdMsg          entityLocale.ViewDataMessage
	invMsg         entityLocale.InviteMessage
	streamMsg      entityLocale.StreamLobbyMessage
	responseMsg    entityLocale.ResponseMessage
	logMsg         entityLocale.LogMessage
	contactMsg     entityLocale.ContactMsg
	crossplayRules string
	crossplayLobby string
	area           string
	lang           string
	conn           string
}

// TODO: Change to msgEmbed or similar
func (h *Handler) msgContactData(nickname, gameName string, listContacts db.ParticipantGetParticipantsListWithTotalCountResponse, local responseLocale) ([]*discordgo.MessageEmbed, error) {
	embed := []*discordgo.MessageEmbed{}

	if len(listContacts.Items) == 0 {
		embed = append(embed, &discordgo.MessageEmbed{
			Title:       fmt.Sprintf("🔎 %s: %s", local.contactMsg.Title, nickname),
			Description: fmt.Sprintf("❌ "+local.contactMsg.FailedResult, nickname),
			Color:       ColorError,
			Timestamp:   time.Now().Format(time.RFC3339),
			Footer: &discordgo.MessageEmbedFooter{
				Text: "TourneyHelper",
			},
		})
		return embed, nil
	}

	player := listContacts.Items[0]
	clearGameNickname := escapeMarkdown(player.GameNickname)
	clearMessenagerLogin := escapeMarkdown(player.MessenagerLogin)
	contactEmbed := &discordgo.MessageEmbed{
		Title:       fmt.Sprintf("🔎 %s: %s", local.contactMsg.Title, clearGameNickname),
		Color:       ColorSuccess,
		Description: fmt.Sprintf("✅ "+local.contactMsg.SuccessResult, nickname),
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   fmt.Sprintf("📝 %s Start.gg", local.contactMsg.TourneyPlatform),
				Value:  fmt.Sprintf("🎮 %s: %s\n✏️ %s\n```fix\n%s\n```", local.contactMsg.GameName, gameName, local.contactMsg.GameNickname, clearGameNickname),
				Inline: true,
			},
			{
				Name:   fmt.Sprintf("💬 %s", local.contactMsg.MessenagerContact),
				Value:  fmt.Sprintf("✉️ <@%s>\n✏️ %s```fix\n%s\n```", clearMessenagerLogin, local.contactMsg.MessenagerLogin, player.MessenagerLogin),
				Inline: true,
			},
		},
		Timestamp: time.Now().Format(time.RFC3339),
		Footer: &discordgo.MessageEmbedFooter{
			Text: "TourneyHelper",
		},
	}

	embed = append(embed, contactEmbed)

	return embed, nil
}

func (s *DiscordSender) prepareMsgSetData(recipient, opponent entitySender.Participant, set entitySender.SetData, local entityLocale.Lang) (*discordgo.MessageEmbed, error) {
	format := s.params.rulesMatches.StandardFormat
	embedColor := ColorDefault

	if set.IsFinals {
		format = s.params.rulesMatches.FinalsFormat
		embedColor = ColorFinal
	}

	if len(set.StreamSourse) > 0 {
		embedColor = ColorStream
	}

	var message *discordgo.MessageEmbed
	gameNickname := opponent.GameNickname
	if len(gameNickname) == 0 || gameNickname == "N/D" {
		gameNickname = local.ErrorMessage.NoData
	}

	gameID := opponent.GameID
	if len(gameID) == 0 {
		gameID = local.ErrorMessage.NoData
	}

	rawID := opponent.MessenagerID
	login := opponent.MessenagerLogin

	var discordDisplay string
	if len(rawID) == 5 && len(login) == 0 {
		discordDisplay = local.ErrorMessage.NoData
	} else {
		if len(rawID) > 0 && rawID != "000000000000000000" && rawID != "N/D" {
			discordDisplay = fmt.Sprintf("<@%v>", rawID)
		} else {
			if len(login) > 0 {
				discordDisplay = login
			} else {
				discordDisplay = local.ErrorMessage.NoData
			}
		}
	}
	log.Printf("prepareSetData | Set: %v | Recipient: %s vs Opponent: %s | Link: %s", set.SetID, recipient.MessenagerLogin, opponent.MessenagerLogin, set.FullInviteLink)

	if len(set.StreamSourse) == 0 {
		fields := []*discordgo.MessageEmbedField{
			{Name: local.InviteMessage.MessageHeader},
			{Name: local.InviteMessage.Nickname, Value: fmt.Sprintf("```%v```", gameNickname), Inline: true},
			{Name: local.InviteMessage.GameID, Value: fmt.Sprintf("```%v```", gameID), Inline: true},
			{Name: local.InviteMessage.Discord, Value: discordDisplay, Inline: true},

			{Name: local.InviteMessage.CheckIn, Value: set.FullInviteLink},
			{Name: fmt.Sprintf(local.InviteMessage.Warning, s.params.rulesMatches.Waiting), Value: "\u200B"},

			{Name: local.InviteMessage.SettingsHeader},
			{Name: local.InviteMessage.StandardFormat, Value: fmt.Sprintf(local.InviteMessage.FT, format) + fmt.Sprintf(local.InviteMessage.FormatDescription, format), Inline: true},
			{Name: local.InviteMessage.Stage, Value: fieldStage(local, s.params.rulesMatches.Stage), Inline: true},
			{Name: local.InviteMessage.Rounds, Value: fmt.Sprintf("%v", s.params.rulesMatches.Rounds), Inline: true},
			{Name: local.InviteMessage.Duration, Value: fmt.Sprintf(local.InviteMessage.DurationCount, s.params.rulesMatches.Duration), Inline: true},
			{Name: local.InviteMessage.Crossplatform, Value: fieldCrossplay(local, s.params.rulesMatches.Crossplatform), Inline: true},
		}
		message = msgEmbed(fmt.Sprintf(local.InviteMessage.Title, set.TournamentName), fields, embedColor, &s.params)
		message.Description = local.InviteMessage.Description
	} else {
		var stream string
		if set.StreamSourse == "TWITCH" {
			stream = "https://www.twitch.tv/" + set.StreamName
		}
		if set.StreamSourse == "YOUTUBE" {
			stream = "https://www.youtube.com/@" + set.StreamName
		}
		fields := []*discordgo.MessageEmbedField{
			{Name: local.StreamLobbyMessage.StreamLink, Value: stream},
			{Name: local.StreamLobbyMessage.MessageHeader, Value: set.FullInviteLink},
			{Name: fmt.Sprintf(local.StreamLobbyMessage.Warning, s.params.rulesMatches.Waiting), Value: "\u200B"},

			{Name: local.StreamLobbyMessage.ParamsHeader},
			{Name: local.InviteMessage.StandardFormat, Value: fmt.Sprintf(local.InviteMessage.FT, format) + fmt.Sprintf(local.InviteMessage.FormatDescription, format), Inline: true},
			{Name: local.StreamLobbyMessage.Area, Value: fieldArea(local, s.params.streamLobby.Area), Inline: true},
			{Name: local.StreamLobbyMessage.Language, Value: fieldLanguage(local, s.params.streamLobby.Language), Inline: true},
			{Name: local.StreamLobbyMessage.TypeConnection, Value: fieldConnection(local, s.params.streamLobby.Conn), Inline: true},
			{Name: local.StreamLobbyMessage.Crossplatform, Value: fieldCrossplay(local, s.params.rulesMatches.Crossplatform), Inline: true},
			{Name: local.StreamLobbyMessage.Passcode, Value: fmt.Sprintf(local.StreamLobbyMessage.PasscodeTemplate, s.params.streamLobby.Passcode), Inline: true},
		}
		message = msgEmbed(fmt.Sprintf(local.StreamLobbyMessage.Title, set.TournamentName), fields, embedColor, &s.params)
		message.Description = local.StreamLobbyMessage.Description
	}
	return message, nil
}

func (s *DiscordSender) msgInvite(targetID string, set entitySender.SetData) (*discordgo.MessageEmbed, entityLocale.Lang, entitySender.Participant) {
	var recipient entitySender.Participant
	var opponent entitySender.Participant
	var sidePrefix string

	if targetID == set.ContactPlayer1.MessenagerID {
		recipient = set.ContactPlayer1
		opponent = set.ContactPlayer2
		sidePrefix = "[P1] "
	} else {
		recipient = set.ContactPlayer2
		opponent = set.ContactPlayer1
		sidePrefix = "[P2] "
	}

	// TODO: Change reconize locale in future
	local := entityLocale.En
	if len(recipient.Locale) > 0 {
		local = entityLocale.Ru
	}

	message, err := s.prepareMsgSetData(recipient, opponent, set, local)
	if err != nil {
		log.Printf("msgInvite | error sended DM: %v\n", err.Error())
		s.logMsgToDiscord(false, err.Error(), set, local, recipient.GameNickname)
		return &discordgo.MessageEmbed{}, entityLocale.En, entitySender.Participant{}
	}

	if set.IsTest {
		message.Title = sidePrefix + message.Title
	}

	return message, local, recipient
}

func (_ *Handler) typeLocale(language string) entityLocale.Lang {
	var local entityLocale.Lang
	switch language {
	case "Russian":
		local = entityLocale.Ru
	default:
		local = entityLocale.En
	}
	return local
}

func (h *Handler) msgViewData(language string) *discordgo.MessageEmbed {
	local := h.typeLocale(language)

	slug := h.params.tournament.UrlToTournament
	if len(slug) == 0 {
		slug = local.ErrorMessage.NoData
	}

	fields := []*discordgo.MessageEmbedField{
		{Name: "**Slug**", Value: fmt.Sprintln(local.ViewDataMessage.Description), Inline: true},
		{Value: fmt.Sprintf("```%v```", slug)},

		{Name: local.ViewDataMessage.MessageRulesHeader},
		{Name: local.InviteMessage.StandardFormat,
			Value:  fmt.Sprintf(local.InviteMessage.FT, h.params.rulesMatches.StandardFormat) + fmt.Sprintf(local.InviteMessage.FormatDescription, h.params.rulesMatches.StandardFormat),
			Inline: true},
		{Name: local.InviteMessage.FinalsFormat,
			Value:  fmt.Sprintf(local.InviteMessage.FT, h.params.rulesMatches.FinalsFormat) + fmt.Sprintf(local.InviteMessage.FormatDescription, h.params.rulesMatches.FinalsFormat),
			Inline: true},
		{Name: local.InviteMessage.Stage,
			Value:  fieldStage(local, h.params.rulesMatches.Stage),
			Inline: true},
		{Name: local.InviteMessage.Rounds,
			Value:  fmt.Sprintf("%v", h.params.rulesMatches.Rounds),
			Inline: true},
		{Name: local.InviteMessage.Duration,
			Value:  fmt.Sprintf(local.InviteMessage.DurationCount, h.params.rulesMatches.Duration),
			Inline: true},
		{Name: local.InviteMessage.Crossplatform,
			Value:  fieldCrossplay(local, h.params.rulesMatches.Crossplatform),
			Inline: true},

		{Name: local.ViewDataMessage.MessageStreamHeader},
		{Name: local.StreamLobbyMessage.Area,
			Value:  fieldArea(local, h.params.streamLobby.Area),
			Inline: true},
		{Name: local.StreamLobbyMessage.Language,
			Value:  fieldLanguage(local, h.params.streamLobby.Language),
			Inline: true},
		{Name: local.StreamLobbyMessage.TypeConnection,
			Value:  fieldConnection(local, h.params.streamLobby.Conn),
			Inline: true},
		{Name: local.StreamLobbyMessage.Crossplatform,
			Value:  fieldCrossplay(local, h.params.rulesMatches.Crossplatform),
			Inline: true},
		{Name: local.StreamLobbyMessage.Passcode,
			Value:  fmt.Sprintf(local.StreamLobbyMessage.PasscodeTemplate, h.params.streamLobby.Passcode),
			Inline: true},
	}
	message := msgEmbed(local.ViewDataMessage.Title, fields, ColorSystem, &h.params)
	return message
}

// TODO: Actualise method
func msgEmbed(title string, fields []*discordgo.MessageEmbedField, color int, cfg *params) *discordgo.MessageEmbed {
	embed := &discordgo.MessageEmbed{
		Title: title,
		Color: color,
		Author: &discordgo.MessageEmbedAuthor{
			IconURL: cfg.logo,
			URL:     "https://github.com/DreamerVulpi/tourneybot",
			Name:    "TourneyHelper",
		},
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: cfg.tournament.Logo.Img,
		},
		Fields:    fields,
		Timestamp: time.Now().Format(time.RFC3339),
		Footer: &discordgo.MessageEmbedFooter{
			Text:    "by DreamerVulpi | https://www.twitch.tv/dreamervulpi",
			IconURL: "https://i.imgur.com/eVmmYEV.png",
		},
	}

	return embed
}

func (s *DiscordSender) logMsgToDiscord(success bool, errStr string, set entitySender.SetData, local entityLocale.Lang, gameNickname string) {
	if s.params.debugChannelID == "" {
		log.Println("logSentMsgToDiscord | skip: debugChannelID is empty")
		return
	}

	var logFields []*discordgo.MessageEmbedField
	var color int

	var state string
	if success {
		color = ColorSuccess
		state = local.LogMessage.SuccessfulMsgHeader
	} else {
		color = ColorError
		state = local.LogMessage.FailMsgHeader
	}

	logFields = []*discordgo.MessageEmbedField{
		{Name: fmt.Sprintf(local.LogMessage.SuccesfullSendedMsg, state), Value: "\u200B"},
		{Name: fmt.Sprintf("Set #%v | ", set.SetID), Value: fmt.Sprintf("%v vs %v", set.ContactPlayer1.GameNickname, set.ContactPlayer2.GameNickname)},
	}

	if len(set.FullInviteLink) > 0 {
		logFields = append(logFields, &discordgo.MessageEmbedField{
			Name: fmt.Sprintf(local.LogMessage.CheckIn, set.FullInviteLink), Value: "\u200B",
		})
	}

	if !success {
		logFields = append(logFields, &discordgo.MessageEmbedField{
			Name: fmt.Sprintf(local.LogMessage.FailedSentMsg, gameNickname, errStr), Value: "\u200B",
		})
	}

	logEmbed := msgEmbed(fmt.Sprintf(local.LogMessage.Title, set.TournamentName), logFields, color, &s.params)
	if _, err := s.session.ChannelMessageSendEmbed(s.params.debugChannelID, logEmbed); err != nil {
		log.Printf("logToDiscord | error sending to debug channel: %v", err)
	}
}
