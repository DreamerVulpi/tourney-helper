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
	"github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	"github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	entityStartgg "github.com/dreamervulpi/tourneyBot/internal/entity/startgg"
	"github.com/dreamervulpi/tourneyBot/internal/infrastructure/startgg"
)

func (a *App) LoadListPlayers(path string, selectedTournamentPlatform string, gameName string, isBan bool) (*app.ImportListPlayersResponse, error) {
	switch strings.ToLower(selectedTournamentPlatform) {
	case "startgg":
		if a.TournamentClient == nil || a.TournamentClient.HTTPClient == nil {
			log.Printf("app | tournament client or http client isn't inittialized (nil)")
			log.Printf("StartggClient: %v", a.TournamentClient)
			log.Printf("StartggClient: %v", a.MessengerClient)
			return nil, fmt.Errorf("tournament client or http client isn't inittialized (nil)")
		}

		client := startgg.NewClient(a.TournamentClient.HTTPClient)
		var list []entityStartgg.ImportedParticipantContact
		var err error
		ext := strings.ToLower(filepath.Ext(path))
		switch ext {
		case ".csv":
			list, err = client.LoadDataFromCSV(path, gameName)
		case ".json":
			list, err = client.LoadDataFromJSON(path, gameName)
		default:
			err := fmt.Errorf("unsupported file extension: %s. Only .csv and .json", ext)
			a.Log(logger.Error, err.Error())
			return nil, err
		}
		if err != nil {
			return nil, err
		}

		s, t, err := a.Db.AddParticipants(a.ctx, list, isBan)
		if err != nil {
			a.Log(logger.Error, err.Error())
			return nil, err
		}

		actionText := "added to system"
		if isBan {
			actionText = "added to ban-list"
		}

		a.Log(logger.Success, fmt.Sprintf("Successful %s %d of %d records", actionText, s, t))
		return &app.ImportListPlayersResponse{Success: s, Total: t}, nil

	default:
		err := fmt.Errorf("no support selected platform: %v", selectedTournamentPlatform)
		a.Log(logger.Error, err.Error())
		return nil, err
	}
}

func (a *App) ResetRating(request db.ParticipantStatResetRequest) error {
	err := a.Db.Stats.ResetRating(a.ctx, request)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return err
	}
	a.Log(logger.Success, "The rating was successfully reset")
	return nil
}

func (a *App) DelParticipant(request db.ParticipantDeleteRequest) error {
	_, err := a.Db.Participant.DelParticipant(a.ctx, request)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return err
	}
	a.Log(logger.Success, fmt.Sprintf("Participant (Id: %v) was successfully deleted from database", request.Id))
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
				a.Log(logger.Error, fmt.Sprintf("Error while clearing expired bans: %v", err))
			}

		case <-ctx.Done():
			a.Log(logger.Error, "Background ban cleanup has been paused")
			return
		}
	}
}

func (a *App) DelBanFromParticipant(request app.UnbanRequest) error {
	err := a.Db.DeleteBan(a.ctx, request.ParticipantId)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return err
	}
	a.Log(logger.Success, fmt.Sprintf("Participant with Id %v was unbanned", request.ParticipantId))
	return nil
}

func (a *App) AddBanToParticipant(request app.BanRequest) error {
	banUntil := a.Db.CalculateBanUntil(request.IsPermanent, request.Duration, request.Unit)
	if banUntil != nil {
		a.Log(logger.Success, fmt.Sprintf("Participant with Id %v was banned (%s) for reason: %v", request.Id, banUntil.Format("2006-01-02 15:04:05"), request.TypeBan))
	} else {
		a.Log(logger.Success, fmt.Sprintf("Participant with Id %v was banned (Permanent) for reason: %v", request.Id, request.TypeBan))
	}
	err := a.Db.AddBan(a.ctx, request.Id, request.TypeBan, request.Reason, banUntil)
	if err != nil {
		a.Log(logger.Error, err.Error())
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
	p := sender.Participant{
		GameNickname:            nickname,
		GameID:                  gameId,
		GameName:                gameName,
		Region:                  region,
		Locale:                  locale,
		MessengerName:           messengerName,
		MessengerLogin:          messengerLogin,
		TournamentPlatformName:  tournamentPlatformName,
		TournamentPlatformLogin: tournamentPlatformLogin,
		Rating:                  rating,
	}

	response, err := a.Db.AddParticipant(a.ctx, p)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return 0, err
	}
	a.Log(logger.Success, fmt.Sprintf("Added successfuly new participant (Nickname: %v)", p.GameNickname))
	return response.Id, nil
}

func (a *App) GetParticipants(messengerName, tournamentPlatformName, gameName string, limit, offset int, search string) (db.ParticipantGetParticipantsListWithTotalCountResponse, error) {
	result, err := a.Db.GetParticipants(a.ctx, messengerName, tournamentPlatformName, gameName, limit, offset, search)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return db.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}
	return result, nil
}
func (a *App) GetParticipantsSortedByRatingList(messengerName, tournamentPlatformName, gameName string, limit, offset int, search string) (db.ParticipantGetParticipantsListWithTotalCountResponse, error) {
	result, err := a.Db.GetParticipantsSortedByRatingList(a.ctx, messengerName, tournamentPlatformName, gameName, limit, offset, search)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return db.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}
	return result, nil
}

func (a *App) GetBanned(nameMessenger string, nameTournamentPlatform string, gameName string, limit, offset int, search string) (db.ParticipantGetListResponse, error) {
	log.Printf("Request: GameName = %v Limit = %v, Offset = %v, Search = \"%v\"", gameName, limit, offset, search)
	result, err := a.Db.GetBanned(a.ctx, nameMessenger, nameTournamentPlatform, gameName, limit, offset, search)
	if err != nil {
		a.Log(logger.Error, err.Error())
		return db.ParticipantGetListResponse{}, err
	}
	return result, nil
}

func (a *App) EditParticipantStatsRating(id, rating int) (db.ParticipantEditResponse, error) {
	result, err := a.Db.Stats.EditParticipantStatsRating(a.ctx, db.ParticipantStatEditRatingRequest{Id: id, Rating: rating})
	if err != nil {
		a.Log(logger.Error, err.Error())
		return db.ParticipantEditResponse{}, err
	}
	a.Log(logger.Success, fmt.Sprintf("The participant's (Id: %v) rating has been successfully updated to %v", id, rating))
	return result, nil
}

func (a *App) EditParticipant(request app.EditParticipantRequest) error {
	p := sender.Participant{
		Id:                      request.Id,
		MessengerLogin:          request.MessengerLogin,
		MessengerName:           request.MessengerName,
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
		a.Log(logger.Error, err.Error())
		return err
	}
	a.Log(logger.Success, fmt.Sprintf("The participant's (Nickname: %v) data has been successfully updated", p.GameNickname))
	return err
}
