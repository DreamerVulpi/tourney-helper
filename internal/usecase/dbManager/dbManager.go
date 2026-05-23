package dbManager

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/dreamervulpi/tourneyBot/internal/entity/app"
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

func (db *Database) RemoveExpiredBans(ctx context.Context) error {
	err := db.Bans.DeleteExpiredBans(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (db *Database) DeleteBan(ctx context.Context, participantId int) error {
	unbanRequest := entityDB.ParticipantBansDeleteRequest{
		ParticipantId: participantId,
	}
	log.Println(unbanRequest)
	_, err := db.Bans.DeleteParticipantBanById(ctx, unbanRequest)
	if err != nil {
		return err
	}
	return nil
}

func (_ *Database) CalculateBanUntil(isPermanent bool, duration int, unit string) *time.Time {
	if isPermanent || unit == "infinite" {
		return nil
	}

	now := time.Now()
	var banUntil time.Time
	switch unit {
	case "minutes":
		banUntil = now.Add(time.Duration(duration) * time.Minute)
	case "hours":
		banUntil = now.Add(time.Duration(duration) * time.Hour)
	case "days":
		banUntil = now.AddDate(0, 0, duration)
	case "months":
		banUntil = now.AddDate(0, duration, 0)
	default:
		banUntil = now.AddDate(0, 0, 1)
	}
	return &banUntil
}
func (db *Database) AddBan(ctx context.Context, participantId int, typeBan string, reason string, expiresAt *time.Time) error {
	banAddRequest := entityDB.ParticipantBansAddRequest{
		ParticipantId: participantId,
		TypeBan:       typeBan,
		Reason:        reason,
		ExpiresAt:     expiresAt,
	}
	log.Println(banAddRequest)
	_, err := db.Bans.AddParticipantBan(ctx, banAddRequest)
	if err != nil {
		return err
	}
	return nil
}

func (db *Database) DelParticipant(ctx context.Context, participantId int) error {
	delRequest := entityDB.ParticipantDeleteRequest{
		Id: participantId,
	}
	log.Println(delRequest)
	_, err := db.Participant.DelParticipant(ctx, delRequest)
	if err != nil {
		return err
	}
	return nil
}

func (db *Database) GetBanned(ctx context.Context, gameName string, limit, offset int, search string) (entityDB.ParticipantGetListResponse, error) {
	responseList, err := db.Bans.GetPartipantsListBans(ctx, entityDB.ParticipantBansGetListRequest{
		GameName: gameName,
		Limit:    limit,
		Offset:   offset,
		Search:   search,
	})
	if err != nil {
		return entityDB.ParticipantGetListResponse{}, err
	}

	log.Println(entityDB.ParticipantGetListResponse{
		ListBanned: responseList.ListBanned,
	})
	return entityDB.ParticipantGetListResponse{
		ListBanned: responseList.ListBanned,
	}, err
}

func (db *Database) GetParticipants(ctx context.Context, messengerName, tournamentPlatformName, gameName string, limit, offset int, search string) (entityDB.ParticipantGetParticipantsListWithTotalCountResponse, error) {
	if err := ctx.Err(); err != nil {
		return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}
	responseTc, err := db.Participant.GetTotalCount(ctx)
	if err != nil {
		return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}
	log.Println(responseTc.TotalCount)

	responseList, err := db.Participant.GetParticipantsList(ctx, entityDB.ParticipantGetParticipantsListRequest{
		MessengerName:          messengerName,
		TournamentPlatformName: tournamentPlatformName,
		GameName:               gameName,
		Limit:                  limit,
		Offset:                 offset,
		Search:                 search,
	})
	if err != nil {
		return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}

	log.Println(entityDB.ParticipantGetParticipantsListWithTotalCountResponse{
		Items:      responseList.ListParticipants,
		TotalCount: responseTc.TotalCount,
	})
	return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{
		Items:      responseList.ListParticipants,
		TotalCount: responseTc.TotalCount,
	}, err
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
	responseMessenger, errMessenger := db.Accounts.GetParticipantAccountByPlatform(ctx, requestMessenger)
	if errMessenger != nil {
		if errors.Is(errMessenger, sql.ErrNoRows) {
			log.Printf("db | failed to get participantAccount %v - %v | %v", requestMessenger.PlatformName, requestMessenger.PlatformId, errMessenger)
		} else {
			return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", errMessenger)
		}
	}

	// Request check tournament account from database
	requestTournamentAccount := entityDB.ParticipantAccountGetRequestByPlatform{
		PlatformName: p.TournamentPlatformName,
		PlatformId:   p.TournamentPlatformID,
	}
	responseTournamentAccount, errTournament := db.Accounts.GetParticipantAccountByPlatform(ctx, requestTournamentAccount)
	if errTournament != nil {
		if errors.Is(errTournament, sql.ErrNoRows) {
			log.Printf("db | failed to get participantAccount %v - %v | %v", requestTournamentAccount.PlatformName, requestTournamentAccount.PlatformId, errTournament)
		} else {
			return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", errTournament)
		}
	}

	// Check targetParticipantId from database
	var targetParticipantId int
	if responseMessenger.ParticipantId != 0 {
		targetParticipantId = responseMessenger.ParticipantId
		log.Printf("targetParticipantId -> %v", targetParticipantId)
	} else {
		targetParticipantId = responseTournamentAccount.ParticipantId
		log.Printf("targetParticipantId -> %v", targetParticipantId)
	}

	log.Printf("targetParticipantId = %v", targetParticipantId)
	if targetParticipantId != 0 {
		requestStatsGame := entityDB.ParticipantStatGetRequestByGame{
			ParticipantId: targetParticipantId,
			GameName:      p.GameName,
		}
		responseStats, err := db.Stats.GetParticipantStatsByGame(ctx, requestStatsGame)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				log.Printf("db | failed to get participant stats %v - %v | %v", requestStatsGame.GameName, p.GameNickname, err)
			} else {
				return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", err)
			}
		}

		requestParticipant := entityDB.ParticipantGetRequestById{
			Id: targetParticipantId,
		}
		log.Printf("GetParticipantById request: %v", requestParticipant.Id)
		responseParticipant, err := db.Participant.GetParticipantById(ctx, requestParticipant)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				log.Printf("db | failed to get participant of ID: %v | %v", requestParticipant.Id, err)
			} else {
				return entitySender.Participant{}, fmt.Errorf("db | critical error: %w", err)
			}
		}
		log.Printf("GetParticipantById result: %v, error: %v", responseParticipant, err)

		var messengerID string
		if responseMessenger.PlatformId != "" {
			messengerID = responseMessenger.PlatformId
		} else {
			messengerID = p.MessenagerID
		}

		var messengerLogin string
		if responseMessenger.PlatformLogin != "" {
			messengerLogin = responseMessenger.PlatformLogin
		} else {
			messengerLogin = p.MessenagerLogin
		}

		var tournamentPlatformID string
		if responseTournamentAccount.PlatformId != "" {
			tournamentPlatformID = responseTournamentAccount.PlatformId
		} else {
			tournamentPlatformID = p.TournamentPlatformID
		}

		var gameNickname string
		if responseTournamentAccount.PlatformLogin != "" {
			gameNickname = responseTournamentAccount.PlatformLogin
		} else {
			gameNickname = p.GameNickname
		}

		var tournamentNickname string
		if responseTournamentAccount.PlatformLogin != "" {
			tournamentNickname = responseTournamentAccount.PlatformLogin
		} else {
			tournamentNickname = "N/D"
		}

		var gameID string
		if responseStats.GameId != "" {
			gameID = responseStats.GameId
		} else {
			gameID = p.GameID
		}

		if responseParticipant.Id != 0 {
			log.Println("db | Successfully get information from database")
			return entitySender.Participant{
				MessenagerID:            messengerID,
				MessenagerLogin:         messengerLogin,
				MessenagerName:          p.MessenagerName,
				TournamentPlatformName:  p.TournamentPlatformName,
				TournamentPlatformLogin: tournamentNickname,
				TournamentPlatformID:    tournamentPlatformID,
				GameNickname:            gameNickname,
				GameName:                p.GameName,
				GameID:                  gameID,
				Locale:                  responseParticipant.Locale,
				IsFound:                 responseMessenger.IsFound || responseTournamentAccount.IsFound,
			}, nil
		} else {
			return entitySender.Participant{}, fmt.Errorf("db | no information about locale participant of ID: %v", responseParticipant.Id)
		}
	} else {
		return entitySender.Participant{}, fmt.Errorf("db | failed to get participant of ID: %v | %v", targetParticipantId, errMessenger)
	}
}

func (db *Database) EditParticipant(ctx context.Context, p entitySender.Participant, ban *app.BanRequest) error {
	log.Printf("Id: %v\n", p.Id)
	log.Printf("MessengerID: %v\n", p.MessenagerID)
	log.Printf("MessengerLogin: %v\n", p.MessenagerLogin)
	log.Printf("MessengerName: %v\n", p.MessenagerName)
	log.Printf("TournamentPlatformName: %v\n", p.TournamentPlatformName)
	log.Printf("TournamentPlatformLogin: %v\n", p.TournamentPlatformLogin)
	log.Printf("TournamentPlatformID: %v\n", p.TournamentPlatformID)
	log.Printf("GameName: %v\n", p.GameName)
	log.Printf("GameNickname: %v\n", p.GameNickname)
	log.Printf("GameID: %v\n", p.GameID)
	log.Printf("Region: %v\n", p.Region)
	log.Printf("Locale: %v\n", p.Locale)
	log.Printf("Rating: %v\n", p.Rating)
	log.Printf("IsFound: %v\n", p.IsFound)
	log.Printf("UpdatedAt: %v\n", p.UpdatedAt)

	tx, err := db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("db | failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	participantTxUc := db.Participant.WithTx(tx)
	accountsTxUc := db.Accounts.WithTx(tx)
	statsTxUc := db.Stats.WithTx(tx)
	banTxUc := db.Bans.WithTx(tx)

	currentParticipant, err := participantTxUc.GetParticipantById(ctx, entityDB.ParticipantGetRequestById{Id: p.Id})
	if err != nil {
		return fmt.Errorf("db | failed to fetch current participant state: %w", err)
	}

	if p.GameNickname != "" && p.Region != "" && p.Locale != "" {
		log.Printf("Сравнение для ID %d: БД ник '%s' vs Новый ник '%s'", p.Id, currentParticipant.Nickname, p.GameNickname)
		log.Printf("Сравнение региона: БД '%s' vs Новый '%s'", currentParticipant.Region, p.Region)
		log.Printf("Сравнение локали: БД '%s' vs Новый '%s'", currentParticipant.Locale, p.Locale)
		if currentParticipant.Nickname != p.GameNickname || currentParticipant.Region != p.Region || currentParticipant.Locale != p.Locale {
			pEditRequest := entityDB.ParticipantEditRequest{
				Id:       p.Id,
				Nickname: p.GameNickname,
				Region:   p.Region,
				Locale:   p.Locale,
			}
			_, err = participantTxUc.EditParticipant(ctx, pEditRequest)
			if err != nil {
				return err
			}
		} else {
			log.Println("Бизнес-логика: Изменений не обнаружено, пропускаем UPDATE основной инфы.")
		}
	}

	if p.MessenagerName != "" && p.MessenagerLogin != "" {
		aEditMessRequest := entityDB.ParticipantAccountEditRequest{
			ParticipantId: p.Id,
			PlatformName:  p.MessenagerName,
			PlatformId:    p.MessenagerID,
			PlatformLogin: p.MessenagerLogin,
			IsFound:       p.IsFound,
		}
		_, err = accountsTxUc.EditParticipantAccount(ctx, aEditMessRequest)
		if err != nil {
			return err
		}
	}

	if p.TournamentPlatformName != "" && p.TournamentPlatformLogin != "" {
		aEditTourRequest := entityDB.ParticipantAccountEditRequest{
			ParticipantId: p.Id,
			PlatformName:  p.TournamentPlatformName,
			PlatformId:    p.TournamentPlatformID,
			PlatformLogin: p.TournamentPlatformLogin,
			IsFound:       p.IsFound,
		}
		_, err = accountsTxUc.EditParticipantAccount(ctx, aEditTourRequest)
		if err != nil {
			return err
		}
	}

	sEditStatRequest := entityDB.ParticipantStatEditRequest{
		ParticipantId: p.Id,
		GameName:      p.GameName,
		GameId:        p.GameID,
		Rating:        p.Rating,
	}
	_, err = statsTxUc.EditParticipantStats(ctx, sEditStatRequest)
	if err != nil {
		return err
	}

	if ban != nil {
		banUntil := db.CalculateBanUntil(ban.IsPermanent, ban.Duration, ban.Unit)
		banRequest := entityDB.ParticipantBansEditRequest{
			ParticipantId: ban.Id,
			TypeBan:       ban.TypeBan,
			Reason:        ban.Reason,
			ExpiresAt:     banUntil,
		}
		_, err := banTxUc.EditParticipantBan(ctx, banRequest)
		if err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("db | failed to commit transaction: %w", err)
	}
	log.Printf("db | successfuly edited participant (ID: %v, Nickname: %v)", p.Id, p.GameNickname)

	return nil
}

func (db *Database) AddParticipant(ctx context.Context, p entitySender.Participant) (entityDB.ParticipantAddResponse, error) {
	log.Printf("Participant data: %v", p)
	tx, err := db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	participantTxUc := db.Participant.WithTx(tx)
	accountsTxUc := db.Accounts.WithTx(tx)
	statsTxUc := db.Stats.WithTx(tx)

	mainNickname := p.GameNickname
	if len(mainNickname) == 0 || mainNickname == "N/D" {
		if len(p.MessenagerLogin) == 0 || p.MessenagerLogin == "N/D" {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to add participant: both game nicknames are empty")
		}
		mainNickname = p.MessenagerLogin
	}

	tempGameID := p.GameID
	if len(tempGameID) == 0 {
		tempGameID = "N/D"
	}

	tempRegion := p.Region
	if len(tempRegion) == 0 {
		tempRegion = "N/D"
	}

	tempLocale := p.Locale
	if len(tempLocale) == 0 {
		tempLocale = "N/D"
	}

	pAddRequest := entityDB.ParticipantAddRequest{
		Nickname: mainNickname,
		Region:   tempRegion,
		Locale:   tempLocale,
	}
	log.Printf("Add request participant: %v", pAddRequest)

	pAddResponse, err := participantTxUc.AddParticipant(ctx, pAddRequest)
	if err != nil {
		return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to save participant %v: %v", p.MessenagerLogin, err)
	} else {
		log.Printf("db | successfully saved participant %v", mainNickname)
	}

	if len(p.MessenagerLogin) != 0 {
		pAddMessengerRequest := entityDB.ParticipantAccountAddRequest{
			ParticipantId: pAddResponse.Id,
			PlatformName:  p.MessenagerName,
			PlatformId:    p.MessenagerID,
			PlatformLogin: p.MessenagerLogin,
			IsFound:       p.IsFound,
		}
		log.Printf("Add request participant Account - Messenger: %v", pAddMessengerRequest)

		if p.MessenagerName == "" {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | messenger name is empty")
		}

		_, err = accountsTxUc.AddParticipantAccount(ctx, pAddMessengerRequest)
		if err != nil {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to add participant account ID: %v - %v - %v | %v", pAddMessengerRequest.ParticipantId, pAddMessengerRequest.PlatformName, pAddMessengerRequest.PlatformLogin, err)
		}
	} else {
		log.Printf("db | messenger login is empty | account messenger don't added")
	}

	log.Printf("tournamentPlatformLogin(%v) !=0 ?", p.TournamentPlatformLogin)
	if len(p.TournamentPlatformLogin) != 0 {
		pAddTournamentAccountRequest := entityDB.ParticipantAccountAddRequest{
			ParticipantId: pAddResponse.Id,
			PlatformName:  p.TournamentPlatformName,
			PlatformId:    p.TournamentPlatformID,
			PlatformLogin: p.TournamentPlatformLogin,
			IsFound:       p.IsFound,
		}
		log.Printf("Add request participant Account - TournamentPlatform: %v", pAddTournamentAccountRequest)

		if p.TournamentPlatformName == "" {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | tournament platform name is empty")
		}
		_, err = accountsTxUc.AddParticipantAccount(ctx, pAddTournamentAccountRequest)
		if err != nil {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to add participant account ID: %v - %v - %v | %v", pAddTournamentAccountRequest.ParticipantId, pAddTournamentAccountRequest.PlatformName, pAddTournamentAccountRequest.PlatformLogin, err)
		}
	}

	pAddStatsRequest := entityDB.ParticipantStatAddRequest{
		ParticipantId: pAddResponse.Id,
		GameName:      p.GameName,
		GameId:        tempGameID,
		Rating:        p.Rating,
	}
	log.Printf("Add request participant Stats: %v", pAddStatsRequest)

	_, err = statsTxUc.AddParticipantStats(ctx, pAddStatsRequest)
	if err != nil {
		return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to add game (%v) stats: %w", p.GameName, err)
	}

	if err := tx.Commit(); err != nil {
		return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to commit transaction: %w", err)
	}
	log.Printf("db | successfuly added new participant (ID: %v, Nickname: %v)", pAddResponse.Id, mainNickname)
	log.Printf("Return from AddParticipant - %v", pAddResponse.Id)
	return pAddResponse, nil
}
