package application

import (
	"context"
	"log"
	"path/filepath"
	"time"

	"fmt"

	"strings"

	"github.com/dreamervulpi/tourneyBot/internal/entity/app"
	"github.com/dreamervulpi/tourneyBot/internal/entity/db"
	"github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	entityStartgg "github.com/dreamervulpi/tourneyBot/internal/entity/startgg"
	"github.com/dreamervulpi/tourneyBot/internal/infrastructure/startgg"
)

// REFACTOR

func (a *App) LoadListPlayers(path string, selectedTournamentPlatform string, gameName string, isBan bool) (int, int, error) {
	switch strings.ToLower(selectedTournamentPlatform) {
	case "startgg":
		if a.TournamentClient == nil || a.TournamentClient.HTTPClient == nil {
			log.Printf("app | tournament client or http client isn't inittialized (nil)")
			log.Printf("StartggClient: %v", a.TournamentClient)
			log.Printf("StartggClient: %v", a.MessengerClient)

		}
		// FIXME: BUG - nil pointer
		client := startgg.NewClient(a.TournamentClient.HTTPClient)

		var list []entityStartgg.ImportedParticipantContact
		var err error
		ext := strings.ToLower(filepath.Ext(path))
		switch ext {
		case ".csv":
			list, err = client.LoadDataFromCSV(path, gameName)
			log.Println(list)
		case ".json":
			list, err = client.LoadDataFromJSON(path, gameName)
			log.Println(list)
		default:
			return 0, 0, fmt.Errorf("unsupported file extension: %s. Only .csv and .json", ext)
		}
		if err != nil {
			return 0, 0, err
		}

		s, t, err := a.Db.AddParticipants(a.ctx, list, isBan)
		if err != nil {
			return 0, 0, err
		}

		// TODO: Add to locale
		actionText := "добавлено в систему"
		if isBan {
			actionText = "добавлено в бан-лист"
		}

		report := fmt.Sprintf("Успешно %s %d из %d записей", actionText, s, t)
		log.Println("app | " + report)
		return s, t, nil

	default:
		return 0, 0, fmt.Errorf("no support selected platform: %v", selectedTournamentPlatform)
	}
}

func (a *App) ResetRaiting(request db.ParticipantStatResetRequest) error {
	err := a.Db.Stats.ResetRaiting(a.ctx, request)
	if err != nil {
		return err
	}
	return nil
}

func (a *App) DelParticipant(request db.ParticipantDeleteRequest) error {
	_, err := a.Db.Participant.DelParticipant(a.ctx, request)
	if err != nil {
		return err
	}
	return nil
}

func (a *App) StartBanCleaner(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			err := a.Db.RemoveExpiredBans(ctx)
			if err != nil {
				log.Printf("Ошибка при очистке просроченных банов: %v", err)
			} else {
				log.Println("Worker: проверка завершена, просроченные баны удалены")
			}

		case <-ctx.Done():
			log.Printf("Фоновая очистка банов остановлена")
			return
		}
	}
}

func (a *App) DelBanFromParticipant(request app.UnbanRequest) error {
	log.Printf("Request: %v", request.ParticipantId)
	err := a.Db.DeleteBan(a.ctx, request.ParticipantId)
	if err != nil {
		return err
	}
	return nil
}

func (a *App) AddBanToParticipant(request app.BanRequest) error {
	log.Printf("Request: %v %v %v %v %v %v", request.Id, request.TypeBan, request.Reason, request.Duration, request.Unit, request.IsPermanent)
	banUntil := a.Db.CalculateBanUntil(request.IsPermanent, request.Duration, request.Unit)
	if banUntil != nil {
		fmt.Printf("Участник с Id %v забанен до %s по причине: %v\n", request.Id, banUntil.Format("2006-01-02 15:04:05"), request.TypeBan)
	} else {
		fmt.Printf("Участник с Id %v  забанен навсегда по причине: %v\n", request.Id, request.TypeBan)
	}
	err := a.Db.AddBan(a.ctx, request.Id, request.TypeBan, request.Reason, banUntil)
	if err != nil {
		return err
	}
	return nil
}

func (a *App) AddParticipant(
	nickname string,
	gameId string,
	gameName string,
	region string,
	locale string,
	rating int,
	messengerName string,
	messengerLogin string,
	tournamentPlatformName string,
	tournamentPlatformLogin string) (int, error) {
	log.Printf("Request: %v %v %v %v %v | Rating: %v | %v %v %v %v", nickname, gameId, gameName, region, locale, rating, messengerName, messengerLogin, tournamentPlatformName, tournamentPlatformLogin)
	p := sender.Participant{
		GameNickname:            nickname,
		GameID:                  gameId,
		GameName:                gameName,
		Region:                  region,
		Locale:                  locale,
		MessenagerName:          messengerName,
		MessenagerLogin:         messengerLogin,
		TournamentPlatformName:  tournamentPlatformName,
		TournamentPlatformLogin: tournamentPlatformLogin,
		Rating:                  rating,
	}

	response, err := a.Db.AddParticipant(a.ctx, p)
	if err != nil {
		return 0, err
	}
	return response.Id, nil
}

func (a *App) GetParticipants(messengerName, tournamentPlatformName, gameName string, limit, offset int, search string) (db.ParticipantGetParticipantsListWithTotalCountResponse, error) {
	log.Printf("Request: %v %v %v Limit = %v, Offset = %v, Search = \"%v\"", messengerName, tournamentPlatformName, gameName, limit, offset, search)
	result, err := a.Db.GetParticipants(a.ctx, messengerName, tournamentPlatformName, gameName, limit, offset, search)
	if err != nil {
		return db.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}
	return result, nil
}

func (a *App) GetBanned(gameName string, limit, offset int, search string) (db.ParticipantGetListResponse, error) {
	log.Printf("Request: GameName = %v Limit = %v, Offset = %v, Search = \"%v\"", gameName, limit, offset, search)
	result, err := a.Db.GetBanned(a.ctx, gameName, limit, offset, search)
	if err != nil {
		return db.ParticipantGetListResponse{}, err
	}
	return result, nil
}

func (a *App) EditParticipantStatsRating(id, rating int) (db.ParticipantEditResponse, error) {
	log.Printf("Request: %v %v", id, rating)
	result, err := a.Db.Stats.EditParticipantStatsRating(a.ctx, db.ParticipantStatEditRatingRequest{Id: id, Rating: rating})
	if err != nil {
		return db.ParticipantEditResponse{}, err
	}
	return result, nil
}

func (a *App) EditParticipant(request app.EditParticipantRequest) error {
	p := sender.Participant{
		Id:                      request.Id,
		MessenagerLogin:         request.MessengerLogin,
		MessenagerName:          request.MessengerName,
		TournamentPlatformName:  request.TournamentPlatformName,
		TournamentPlatformLogin: request.TournamentPlatformLogin,
		GameName:                request.GameName,
		GameNickname:            request.Nickname,
		GameID:                  request.GameId,
		Region:                  request.Region,
		Locale:                  request.Locale,
		Rating:                  request.Rating,
	}

	var ban *app.BanRequest
	if request.BanInfo != nil {
		ban = &app.BanRequest{
			Id:          request.Id,
			TypeBan:     request.BanInfo.TypeBan,
			Reason:      request.BanInfo.Reason,
			Duration:    request.BanInfo.Duration,
			Unit:        request.BanInfo.Unit,
			IsPermanent: request.BanInfo.IsPermanent,
		}
	}

	err := a.Db.EditParticipant(a.ctx, p, ban)
	if err != nil {
		return err
	}
	return err
}

// func (a *App) EditParticipant(
// 	id int,
// 	nickname string,
// 	gameId string,
// 	gameName string,
// 	region string,
// 	locale string,
// 	rating int,
// 	messengerName string,
// 	messengerLogin string,
// 	tournamentPlatformName string,
// 	tournamentPlatformLogin string) error {
// 	log.Printf("Request: %v %v %v %v %v | Rating: %v | %v %v %v %v", nickname, gameId, gameName, region, locale, rating, messengerName, messengerLogin, tournamentPlatformName, tournamentPlatformLogin)
// 	p := sender.Participant{
// 		Id:                      id,
// 		MessenagerLogin:         messengerLogin,
// 		MessenagerName:          messengerName,
// 		TournamentPlatformName:  tournamentPlatformName,
// 		TournamentPlatformLogin: tournamentPlatformLogin,
// 		GameName:                gameName,
// 		GameNickname:            nickname,
// 		GameID:                  gameId,
// 		Region:                  region,
// 		Locale:                  locale,
// 		Rating:                  rating,
// 	}

// 	err := a.Db.EditParticipant(a.ctx, p)
// 	if err != nil {
// 		return err
// 	}
// 	return err
// }
