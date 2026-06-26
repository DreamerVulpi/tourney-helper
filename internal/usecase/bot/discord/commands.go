package discord

import (
	"log"

	"github.com/bwmarrin/discordgo"
	"github.com/dreamervulpi/tourneyBot/config"
)

func (h *Handler) commands() []*discordgo.ApplicationCommand {
	dmPermission := false

	return []*discordgo.ApplicationCommand{
		{
			Name:        "check",
			Description: "Check startgg, discord and bot variables",
			NameLocalizations: &map[discordgo.Locale]string{
				discordgo.Russian: "проверка",
			},
			DescriptionLocalizations: &map[discordgo.Locale]string{
				discordgo.Russian: "Проверить переменные startgg, discord, и бота",
			},
			DMPermission: &dmPermission,
		},
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
				// TODO: UPDATE WITH CHALLONGE
				// {
				// 	Type:        discordgo.ApplicationCommandOptionString,
				// 	Name:        "platform",
				// 	Description: "Select the tournament platform",
				// 	Required:    true,
				// 	NameLocalizations: map[discordgo.Locale]string{
				// 		discordgo.Russian: "платформа",
				// 	},
				// 	DescriptionLocalizations: map[discordgo.Locale]string{
				// 		discordgo.Russian: "Выберите турнирную платформу",
				// 	},
				// 	Choices: []*discordgo.ApplicationCommandOptionChoice{
				// 		{
				// 			Name:  "Start.gg",
				// 			Value: "Startgg",
				// 		},
				// 		{
				// 			Name:  "Challonge",
				// 			Value: "Challonge",
				// 		},
				// 	},
				// },
			},
		},
	}
}

func (h *Handler) InitCommands(appID string, session *discordgo.Session, tournament *config.ConfigTournament, cfg *config.ConfigMessenger) ([]*discordgo.ApplicationCommand, error) {
	commandHandlers := make(map[string]func(s *discordgo.Session, i *discordgo.InteractionCreate))
	commandHandlers["check"] = h.viewData

	if err := h.createTourneyRole(session); err != nil {
		return nil, err
	}
	commandHandlers["contact"] = h.viewContact

	session.AddHandler(func(
		s *discordgo.Session,
		i *discordgo.InteractionCreate,
	) {
		if h, ok := commandHandlers[i.ApplicationCommandData().Name]; ok {
			h(s, i)
		}
	})

	log.Println("adding commands...")
	commands := h.commands()
	registeredCommands := make([]*discordgo.ApplicationCommand, len(commands))
	for i, command := range commands {
		cmd, err := session.ApplicationCommandCreate(appID, cfg.Discord.GuildID, command)
		log.Printf("%v\n", command.Name)
		if err != nil {
			log.Printf("can't create '%v' command: %v\n", command.Name, err)
		}
		registeredCommands[i] = cmd
	}

	return registeredCommands, nil
}
