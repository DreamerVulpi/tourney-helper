package dbManager

import (
	"context"

	"database/sql"
	"errors"
	"fmt"
	"log"

	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

// Request check messenger account from database
func (db *Database) findMessengerAccount(ctx context.Context, p entitySender.Participant) (entityDB.ParticipantAccountGetResponse, error) {
	var responseMessenger entityDB.ParticipantAccountGetResponse
	var errMessenger error
	// Request check messenger account from database using ID
	if p.MessenagerID != "" && p.MessenagerID != "N/D" {
		responseMessenger, errMessenger = db.Accounts.GetParticipantAccountByPlatform(ctx, entityDB.ParticipantAccountGetRequestByPlatform{
			PlatformName: p.MessenagerName,
			PlatformId:   p.MessenagerID,
		})
		if errMessenger != nil {
			if errors.Is(errMessenger, sql.ErrNoRows) {
				log.Printf("db | failed to get participantAccount using ID %v - %v | %v", p.MessenagerName, p.MessenagerID, errMessenger)
			} else {
				return entityDB.ParticipantAccountGetResponse{}, fmt.Errorf("db | critical error: %w", errMessenger)
			}
		}
	}

	// Request check messenger account from database using login
	if responseMessenger.ParticipantId == 0 && p.MessenagerLogin != "" && p.MessenagerLogin != "N/D" {
		responseMessenger, errMessenger = db.Accounts.GetParticipantAccountByLogin(ctx, entityDB.ParticipantAccountGetRequestByLogin{
			PlatformName:  p.MessenagerName,
			PlatformLogin: p.MessenagerLogin,
		})
		if errMessenger != nil {
			if errors.Is(errMessenger, sql.ErrNoRows) {
				log.Printf("db | failed to get participantAccount using login %v - %v | %v", p.MessenagerName, p.MessenagerLogin, errMessenger)
			} else {
				return entityDB.ParticipantAccountGetResponse{}, fmt.Errorf("db | critical error: %w", errMessenger)
			}
		}
	}

	if responseMessenger.ParticipantId == 0 {
		return entityDB.ParticipantAccountGetResponse{}, sql.ErrNoRows
	}

	return responseMessenger, nil
}

// Request check tournament account from database
func (db *Database) findTournamentAccount(ctx context.Context, p entitySender.Participant) (entityDB.ParticipantAccountGetResponse, error) {
	var responseTournamentAccount entityDB.ParticipantAccountGetResponse
	var errTournament error
	requestTournamentAccount := entityDB.ParticipantAccountGetRequestByPlatform{
		PlatformName: p.TournamentPlatformName,
		PlatformId:   p.TournamentPlatformID,
	}
	responseTournamentAccount, errTournament = db.Accounts.GetParticipantAccountByPlatform(ctx, requestTournamentAccount)
	if errTournament != nil {
		if errors.Is(errTournament, sql.ErrNoRows) {
			log.Printf("db | failed to get participantAccount %v - %v | %v", requestTournamentAccount.PlatformName, requestTournamentAccount.PlatformId, errTournament)
		} else {
			return entityDB.ParticipantAccountGetResponse{}, fmt.Errorf("db | critical error: %w", errTournament)
		}
	}
	return responseTournamentAccount, nil
}

func (db *Database) findStatsParticipant(ctx context.Context, targetParticipantId int, gameName string) (entityDB.ParticipantStatGetResponse, error) {
	request := entityDB.ParticipantStatGetRequestByGame{
		ParticipantId: targetParticipantId,
		GameName:      gameName,
	}
	response, err := db.Stats.GetParticipantStatsByGame(ctx, request)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("db | failed to get participant stats %v - %v | %v", request.ParticipantId, request.GameName, err)
		} else {
			return entityDB.ParticipantStatGetResponse{}, fmt.Errorf("db | critical error: %w", err)
		}
	}
	return response, nil
}

func (db *Database) findParticipantById(ctx context.Context, participantId int) (entityDB.ParticipantGetResponse, error) {
	request := entityDB.ParticipantGetRequestById{
		Id: participantId,
	}

	response, err := db.Participant.GetParticipantById(ctx, request)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("db | failed to get participant of ID: %v | %v", request.Id, err)
		} else {
			return entityDB.ParticipantGetResponse{}, fmt.Errorf("db | critical error: %w", err)
		}
	}
	return response, nil
}

// Get participantId and check values
func resolveParticipantId(messengerData, tournamentAccountData entityDB.ParticipantAccountGetResponse) (int, bool) {
	var participantId int
	if messengerData.ParticipantId != 0 {
		participantId = messengerData.ParticipantId
	} else {
		participantId = tournamentAccountData.ParticipantId
	}

	if participantId != 0 {
		return participantId, true
	} else {
		return participantId, false
	}
}

func (db *Database) buildDataOfParticipant(participantData entityDB.ParticipantGetResponse, messengerData, tournamentAccountData entityDB.ParticipantAccountGetResponse, statsData entityDB.ParticipantStatGetResponse, apiData entitySender.Participant) entitySender.Participant {
	var messengerID string
	if messengerData.PlatformId != "" {
		messengerID = messengerData.PlatformId
	} else {
		messengerID = apiData.MessenagerID
	}

	var messengerLogin string
	if messengerData.PlatformLogin != "" {
		messengerLogin = messengerData.PlatformLogin
	} else {
		messengerLogin = apiData.MessenagerLogin
	}

	var tournamentPlatformID string
	if tournamentAccountData.PlatformId != "" {
		tournamentPlatformID = tournamentAccountData.PlatformId
	} else {
		tournamentPlatformID = apiData.TournamentPlatformID
	}

	var gameNickname string
	if tournamentAccountData.PlatformLogin != "" {
		gameNickname = tournamentAccountData.PlatformLogin
	} else {
		gameNickname = apiData.GameNickname
	}

	var tournamentNickname string
	if tournamentAccountData.PlatformLogin != "" {
		tournamentNickname = tournamentAccountData.PlatformLogin
	} else {
		tournamentNickname = "N/D"
	}

	var gameID string
	if statsData.GameId != "" {
		gameID = statsData.GameId
	} else {
		gameID = apiData.GameID
	}

	return entitySender.Participant{
		Id:                      participantData.Id,
		MessenagerID:            messengerID,
		MessenagerLogin:         messengerLogin,
		MessenagerName:          apiData.MessenagerName,
		TournamentPlatformName:  apiData.TournamentPlatformName,
		TournamentPlatformLogin: tournamentNickname,
		TournamentPlatformID:    tournamentPlatformID,
		GameNickname:            gameNickname,
		GameName:                apiData.GameName,
		GameID:                  gameID,
		DmChannelId:             messengerData.DmChannelId,
		Locale:                  participantData.Locale,
		IsFound:                 messengerData.IsFound || tournamentAccountData.IsFound,
	}
}
