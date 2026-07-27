package discord

import (
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/dreamervulpi/tourney-helper/config"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func (h *Handler) commands() []*discordgo.ApplicationCommand {
	dmPermission := false

	return []*discordgo.ApplicationCommand{
		{
			Name:        "contact",
			Description: "Retrieve a player's contact information from the TourneyHelper database",
			NameLocalizations: &map[discordgo.Locale]string{
				discordgo.Russian: "контакт",
			},
			DescriptionLocalizations: &map[discordgo.Locale]string{
				discordgo.Russian: "Получить контакт игрока из базы данных TourneyHelper",
			},
			DMPermission: &dmPermission,
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "nickname",
					Description: "Player nickname (case-insensitive)",
					Required:    true,
					NameLocalizations: map[discordgo.Locale]string{
						discordgo.Russian: "никнейм",
					},
					DescriptionLocalizations: map[discordgo.Locale]string{
						discordgo.Russian: "Никнейм игрока (регистр символов не важен)",
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "game",
					Description: "Select the game",
					Required:    true, // Делаем обязательным, чтобы не путать фильтры
					NameLocalizations: map[discordgo.Locale]string{
						discordgo.Russian: "игра",
					},
					DescriptionLocalizations: map[discordgo.Locale]string{
						discordgo.Russian: "Выберите дисциплину (игру)",
					},
					Choices: []*discordgo.ApplicationCommandOptionChoice{
						{
							Name:  "Tekken 8",
							Value: "Tekken8",
							NameLocalizations: map[discordgo.Locale]string{
								discordgo.Russian: "Tеккен 8",
							},
						},
						{
							Name:  "Street Fighter 6",
							Value: "SF6",
							NameLocalizations: map[discordgo.Locale]string{
								discordgo.Russian: "Street Fighter 6",
							},
						},
					},
				},
			},
		},
	}
}

func (h *Handler) InitCommands(appID string, session *discordgo.Session, tournament *config.ConfigTournament, cfg *config.ConfigMessenger) ([]*discordgo.ApplicationCommand, error) {
	commandHandlers := make(map[string]func(i *discordgo.InteractionCreate))
	commandHandlers["contact"] = h.viewContact

	if err := h.createTourneyRole(session); err != nil {
		return nil, err
	}

	session.AddHandler(func(
		s *discordgo.Session,
		i *discordgo.InteractionCreate,
	) {
		if h, ok := commandHandlers[i.ApplicationCommandData().Name]; ok {
			h(i)
		}
	})

	logger.Log(entityLogger.Info, "Discord: adding commands...")
	commands := h.commands()
	registeredCommands := make([]*discordgo.ApplicationCommand, len(commands))
	for i, command := range commands {
		cmd, err := session.ApplicationCommandCreate(appID, cfg.Discord.GuildID, command)
		if err != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("can't create '%v' command: %v\n", command.Name, err))
		}
		logger.Log(entityLogger.Info, fmt.Sprintf("Discord: Success added command - %v\n", command.Name))
		registeredCommands[i] = cmd
	}

	return registeredCommands, nil
}
