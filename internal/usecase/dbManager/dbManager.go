package dbManager

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"

	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/db"
)

type Database struct {
	Conn        *sql.DB
	Participant db.Participant
	Accounts    db.ParticipantAccounts
	Stats       db.ParticipantStats
	Bans        db.ParticipantBans
	SentSets    db.SentSet
}

func (db *Database) GetParticipant(ctx context.Context, p entitySender.Participant) (entitySender.Participant, error) {
	if err := ctx.Err(); err != nil {
		return entitySender.Participant{}, err
	}

	// Request check messenger account from database
	requestMessenger := entityDB.ParticipantAccountGetRequestByPlatform{
		PlatformName: p.MessenagerName,
		PlatformId:   p.MessenagerID,
	}
	responseMessenger, err := db.Accounts.GetParticipantAccountByPlatform(ctx, requestMessenger)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("db | failed to get participantAccount %v - %v | %v", requestMessenger.PlatformName, requestMessenger.PlatformId, err)
		} else {
			return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", err)
		}
	}

	// Request check game account from database
	requestGameAccount := entityDB.ParticipantAccountGetRequestByPlatform{
		PlatformName: p.GameName,
		PlatformId:   p.GameID,
	}
	responseGameAccount, err := db.Accounts.GetParticipantAccountByPlatform(ctx, requestGameAccount)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("db | failed to get participantAccount %v - %v | %v", requestGameAccount.PlatformName, requestGameAccount.PlatformId, err)
		} else {
			return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", err)
		}
	}

	// Check tartgetParticipantId from database
	var tartgetParticipantId int
	if responseMessenger.ParticipantId != 0 {
		tartgetParticipantId = responseMessenger.ParticipantId
	} else {
		tartgetParticipantId = responseGameAccount.ParticipantId
	}

	if tartgetParticipantId != 0 {
		requestStatsGame := entityDB.ParticipantStatGetRequestByGame{
			ParticipantId: tartgetParticipantId,
			GameName:      p.GameName,
		}
		responseStats, err := db.Stats.GetParticipantStatsByGame(ctx, requestStatsGame)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				log.Printf("db | failed to get stats of participant of ID: %v | %v", requestStatsGame.ParticipantId, err)
			} else {
				return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", err)
			}
		}

		requestParticipant := entityDB.ParticipantGetRequestById{
			Id: tartgetParticipantId,
		}
		responseParticipant, err := db.Participant.GetParticipantById(ctx, requestParticipant)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				log.Printf("db | failed to get participant of ID: %v | %v", requestParticipant.Id, err)
			} else {
				return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", err)
			}
		}

		if responseParticipant.Id != 0 {
			return entitySender.Participant{
				MessenagerID:           responseMessenger.PlatformId,
				MessenagerLogin:        responseMessenger.PlatformLogin,
				MessenagerName:         responseMessenger.PlatformName,
				TournamentPlatformName: responseGameAccount.PlatformName,
				TournamentPlatformID:   responseGameAccount.PlatformId,
				GameNickname:           responseGameAccount.PlatformLogin,
				GameName:               responseStats.GameName,
				GameID:                 responseStats.GameId,
				Locale:                 responseParticipant.Locale,
				IsFound:                responseMessenger.IsFound,
			}, nil
		} else {
			return entitySender.Participant{}, fmt.Errorf("db | no information about locale participant of ID: %v", responseParticipant.Id)
		}
	} else {
		return entitySender.Participant{}, fmt.Errorf("db | failed to get participant of ID: %v | %v", tartgetParticipantId, err)
	}
}

func (db *Database) AddParticipant(ctx context.Context, p entitySender.Participant) error {
	log.Printf("Participant data: %v", p)
	tx, err := db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("db | failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	participantTxUc := db.Participant.WithTx(tx)
	accountsTxUc := db.Accounts.WithTx(tx)
	statsTxUc := db.Stats.WithTx(tx)

	pAddRequest := entityDB.ParticipantAddRequest{
		Nickname: p.GameNickname,
		// TODO: Add region
		Region: "N/D",
		Locale: p.Locale,
	}
	log.Printf("Add request participant: %v", pAddRequest)

	pAddResponse, err := participantTxUc.AddParticipant(ctx, pAddRequest)
	if err != nil {
		return fmt.Errorf("db | failed to save participant %v: %v", p.MessenagerLogin, err)
	} else {
		log.Printf("db | successfully saved participant %v", p.MessenagerLogin)
	}

	pAddMessengerRequest := entityDB.ParticipantAccountAddRequest{
		ParticipantId: pAddResponse.Id,
		PlatformName:  p.MessenagerName,
		PlatformId:    p.MessenagerID,
		PlatformLogin: p.MessenagerLogin,
		IsFound:       p.IsFound,
	}
	log.Printf("Add request participant Account - Messenger: %v", pAddMessengerRequest)

	if p.MessenagerName == "" {
		return fmt.Errorf("db | messenger name is empty")
	}

	_, err = accountsTxUc.AddParticipantAccount(ctx, pAddMessengerRequest)
	if err != nil {
		return fmt.Errorf("db | failed to add participant account ID: %v - %v - %v | %v", pAddMessengerRequest.ParticipantId, pAddMessengerRequest.PlatformName, pAddMessengerRequest.PlatformLogin, err)
	}

	pAddTournamentAccountRequest := entityDB.ParticipantAccountAddRequest{
		ParticipantId: pAddResponse.Id,
		PlatformName:  p.TournamentPlatformName,
		PlatformId:    p.TournamentPlatformID,
		PlatformLogin: p.GameNickname,
		IsFound:       p.IsFound,
	}
	log.Printf("Add request participant Account - TournamentPlatform: %v", pAddTournamentAccountRequest)

	if p.TournamentPlatformName == "" {
		return fmt.Errorf("db | tournament platform name is empty")
	}
	_, err = accountsTxUc.AddParticipantAccount(ctx, pAddTournamentAccountRequest)
	if err != nil {
		return fmt.Errorf("db | failed to add participant account ID: %v - %v - %v | %v", pAddTournamentAccountRequest.ParticipantId, pAddTournamentAccountRequest.PlatformName, pAddTournamentAccountRequest.PlatformLogin, err)
	}

	pAddStatsRequest := entityDB.ParticipantStatAddRequest{
		ParticipantId: pAddResponse.Id,
		GameName:      p.GameName,
		GameId:        p.GameID,
		Rating:        0,
	}
	log.Printf("Add request participant Stats: %v", pAddStatsRequest)

	_, err = statsTxUc.AddParticipantStats(ctx, pAddStatsRequest)
	if err != nil {
		return fmt.Errorf("db | failed to add game (%v) stats: %w", p.GameName, err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("db | failed to commit transaction: %w", err)
	}

	log.Printf("db | successfuly added new participant (ID: %v, Nickname: %v)", pAddResponse.Id, p.MessenagerLogin)
	return nil
}
