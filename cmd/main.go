package main

import (
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"runtime/debug"

	"context"

	"github.com/dreamervulpi/tourneyBot/config"
	"github.com/dreamervulpi/tourneyBot/internal/auth"
	"github.com/dreamervulpi/tourneyBot/internal/db"
	"github.com/dreamervulpi/tourneyBot/internal/db/repo"
	loggerEntity "github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/bot/discord"
	usecaseDB "github.com/dreamervulpi/tourneyBot/internal/usecase/db"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/logger"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/sender"
	"github.com/joho/godotenv"
)

func main() {
	logDir := "logs"
	err := logger.Init(logDir)
	if err != nil {
		fmt.Printf("Can't launch logging: %v\n", err)
		os.Exit(1)
	}
	defer logger.Close()

	defer func() {
		if r := recover(); r != nil {
			log.Printf("Critical error\n Why? %v\n Stack:\n%s", r, debug.Stack())
			fmt.Println("Programm closed with error. More details in folder logs")
		}
	}()

	if err := godotenv.Load(".env"); err != nil {
		log.Fatalf("LoadEnv: %v\n", err)
	}

	// ctx := context.Background()

	// // Challonge
	// chAuth := &auth.AuthClient{
	// 	Config:     auth.GetChallongeOauth2(),
	// 	TokenFile:  "token_challonge.json",
	// 	HTTPClient: &http.Client{},
	// }

	// // auth.TestChallongeCall(chAuth)
	// token, err := chAuth.GetAccessToken("token_challonge.json")
	// if err != nil {
	// 	log.Printf("can't get token Challonge: %v\n", err)
	// }

	// ch := challonge.NewClient(chAuth.HTTPClient, token)
	// tournament, err := ch.GetTournament(ctx, "https://challonge.com/ru/tournamentdciii")
	// if err != nil {
	// 	log.Printf("err | %v", err)
	// }
	// log.Println(tournament.Name)
	// log.Println(tournament.Description)

	// matches, err := ch.GetMatches(ctx, "https://challonge.com/ru/tournamentdciii")
	// log.Println(matches)

	// p, err := ch.GetParticipant(ctx, "https://challonge.com/ru/tournamentdciii", "112579133")
	// if err != nil {
	// 	log.Printf("err | %v", err)
	// }
	// log.Println(p)

	// Для Discord
	dsAuth := &auth.AuthClient{
		NamePlatform: "discord",
		Config:       auth.GetDiscordOauth2(os.Getenv("DISCORD_CLIENT_ID"), os.Getenv("DISCORD_CLIENT_SECRET")),
		TokenFile:    "token_discord.json",
	}

	ggAuth := &auth.AuthClient{
		NamePlatform: "startgg",
		Config:       auth.GetStartggOauth2(os.Getenv("STARTGG_CLIENT_ID"), os.Getenv("STARTGG_CLIENT_SECRET")),
		TokenFile:    "token_startgg.json",
	}

	log.Println("Запрашиваем данные профиля...")

	cfg, err := config.LoadConfig(config.GetAbsPath("config.toml"))
	if err != nil {
		log.Println(errors.New("not loaded: ").Error() + err.Error())
	} else {
		conn, err := db.NewPool()
		if err != nil {
			log.Println(err)
			return
		}
		tournament, err := config.LoadTournament(config.GetAbsPath("tournament.toml"))
		if err != nil {
			log.Println(errors.New("not loaded: ").Error() + err.Error())
		} else {
			db := dbManager.Database{
				Conn:        conn,
				Participant: usecaseDB.Participant{Repo: &repo.Participants{Conn: conn}},
				Accounts:    usecaseDB.ParticipantAccounts{Repo: &repo.ParticipantAccounts{Conn: conn}},
				Stats:       usecaseDB.ParticipantStats{Repo: &repo.ParticipantStats{Conn: conn}},
				Bans:        usecaseDB.ParticipantBans{Repo: &repo.ParticipantBans{Conn: conn}},
				SentSets:    usecaseDB.SentSet{Repo: &repo.SentSet{Conn: conn}},
			}

			contacts, err := sender.LoadCSV(config.GetAbsPath(tournament.Csv.NameFile))
			if err != nil {
				log.Printf("CSV isn't loaded: %v", err)
			}

			log.Printf("Check config: %v", tournament.UrlToTournament)
			adapter, err := sender.GetTournamentAdapter(ggAuth, "Discord", tournament.UrlToTournament, cfg.DebugMode.Mode, tournament.Game.Name, contacts)
			if err != nil {
				log.Println(err)
				return
			}

			dh := discord.Handler{Auth: dsAuth}
			ctx := context.Background()
			meDiscordPlatform, err := dh.Auth.GetDiscordMe(ctx)
			if err != nil {
				logger.Log(loggerEntity.Error, fmt.Sprintf("InitBot | Failed to get debug user: %v", err))
				return
			}
			ns := sender.NewNotificationSystem(nil, adapter, &db, cfg.DebugMode.Mode, entitySender.Participant{
				MessengerID:    meDiscordPlatform.ID,
				MessengerLogin: meDiscordPlatform.Username,
				Locale:         "ru",
				GameName:       tournament.Game.Name,
			}, 5*time.Minute)
			dh.Ns = ns
			if cfg.DebugMode.Mode {
				logger.Log(loggerEntity.Warning, fmt.Sprintf("DEBUG MODE ON - Test contact is %v on platform %v", meDiscordPlatform.Username, "Discord"))
			}
			if err := dh.Start(ctx, ggAuth, conn, cfg, tournament); err != nil {
				log.Println(err)
			}
		}
	}
}
