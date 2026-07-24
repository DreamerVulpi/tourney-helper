package dbManager

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	entityApp "github.com/dreamervulpi/tourneyBot/internal/entity/app"
	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	entityStartgg "github.com/dreamervulpi/tourneyBot/internal/entity/startgg"
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

func (db *Database) GetBanned(ctx context.Context, nameMessenger string, nameTournamentPlatform string, gameName string, limit, offset int, search string) (entityDB.ParticipantGetListResponse, error) {
	tc, err := db.Bans.TotalCount(ctx)
	if err != nil {
		return entityDB.ParticipantGetListResponse{}, err
	}

	responseList, err := db.Bans.GetPartipantsListBans(ctx, entityDB.ParticipantBansGetListRequest{
		NameMessenger:          nameMessenger,
		NameTournamentPlatform: nameTournamentPlatform,
		GameName:               gameName,
		Limit:                  limit,
		Offset:                 offset,
		Search:                 search,
	})
	if err != nil {
		return entityDB.ParticipantGetListResponse{}, err
	}

	return entityDB.ParticipantGetListResponse{
		ListBanned: responseList.ListBanned,
		TotalCount: tc.TotalCount,
	}, err
}

func (db *Database) GetParticipants(ctx context.Context, messengerName, tournamentPlatformName, gameName string, limit, offset int, search string) (entityDB.ParticipantGetParticipantsListWithTotalCountResponse, error) {
	if err := ctx.Err(); err != nil {
		return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}

	responseTc, err := db.Participant.GetTotalCount(ctx, entityDB.ParticipantGetTotalCountRequest{GameName: gameName})
	if err != nil {
		return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}

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

	return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{
		Items:      responseList.ListParticipants,
		TotalCount: responseTc.TotalCount,
	}, err
}
func (db *Database) GetParticipantsSortedByRatingList(ctx context.Context, messengerName, tournamentPlatformName, gameName string, limit, offset int, search string) (entityDB.ParticipantGetParticipantsListWithTotalCountResponse, error) {
	if err := ctx.Err(); err != nil {
		return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}

	responseTc, err := db.Participant.GetTotalCountInRatingLeague(ctx, entityDB.ParticipantGetTotalCountRequest{GameName: gameName})
	if err != nil {
		return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{}, err
	}

	responseList, err := db.Participant.GetParticipantsSortedByRatingList(ctx, entityDB.ParticipantGetParticipantsListRequest{
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

	return entityDB.ParticipantGetParticipantsListWithTotalCountResponse{
		Items:      responseList.ListParticipants,
		TotalCount: responseTc.TotalCount,
	}, err
}

func (db *Database) GetParticipant(ctx context.Context, p entitySender.Participant) (entitySender.Participant, error) {
	if err := ctx.Err(); err != nil {
		return entitySender.Participant{}, err
	}

	responseMessenger, errMessenger := db.findMessengerAccount(ctx, p)
	responseTournamentAccount, errTournament := db.findTournamentAccount(ctx, p)

	participantId, ok := resolveParticipantId(responseMessenger, responseTournamentAccount)
	if !ok {
		if errors.Is(errMessenger, sql.ErrNoRows) &&
			errors.Is(errTournament, sql.ErrNoRows) {
			return entitySender.Participant{}, sql.ErrNoRows
		}

		return entitySender.Participant{}, fmt.Errorf(
			"db | failed to resolve participant id: %w",
			errors.Join(errMessenger, errTournament),
		)
	}

	responseStats, errStats := db.findStatsParticipant(ctx, participantId, p.GameName)
	if errStats != nil {
		return entitySender.Participant{}, fmt.Errorf("db | failed to get participant: %v | %v | %v | %v", participantId, errMessenger, errTournament, errStats)
	}

	responseParticipant, errParticipant := db.findParticipantById(ctx, participantId)
	if errParticipant != nil {
		return entitySender.Participant{}, fmt.Errorf("db | failed to get participant: %v | %v | %v | %v | %v", participantId, errMessenger, errTournament, errStats, errParticipant)
	}

	log.Println("db | Successfully get information from database")
	return db.buildDataOfParticipant(responseParticipant, responseMessenger, responseTournamentAccount, responseStats, p), nil
}

func (db *Database) EditParticipant(ctx context.Context, p entitySender.Participant, ban *entityApp.BanRequest) error {
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

	if p.MessengerName != "" && p.MessengerLogin != "" {
		aEditMessRequest := entityDB.ParticipantAccountEditRequest{
			ParticipantId: p.Id,
			PlatformName:  p.MessengerName,
			PlatformId:    p.MessengerID,
			PlatformLogin: p.MessengerLogin,
			IsFound:       p.IsFound,
			DmChannelId:   p.DmChannelId,
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
			DmChannelId:   p.DmChannelId,
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
	tx, err := db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	response, err := db.addParticipantWithTx(ctx, tx, p, false)
	if err != nil {
		return entityDB.ParticipantAddResponse{}, err
	}

	if err := tx.Commit(); err != nil {
		return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to commit transaction: %w", err)
	}
	return response, nil
}

func (db *Database) addParticipantWithTx(ctx context.Context, tx *sql.Tx, p entitySender.Participant, isBan bool) (entityDB.ParticipantAddResponse, error) {
	log.Printf("Participant data: %v", p)

	participantTxUc := db.Participant.WithTx(tx)
	accountsTxUc := db.Accounts.WithTx(tx)
	statsTxUc := db.Stats.WithTx(tx)

	mainNickname := p.GameNickname
	if len(mainNickname) == 0 || mainNickname == "N/D" {
		if len(p.MessengerLogin) == 0 || p.MessengerLogin == "N/D" {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to add participant: both game nicknames are empty")
		}
		mainNickname = p.MessengerLogin
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
		return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to save participant %v: %v", p.MessengerLogin, err)
	} else {
		log.Printf("db | successfully saved participant %v", mainNickname)
	}

	if len(p.MessengerLogin) != 0 {
		pAddMessengerRequest := entityDB.ParticipantAccountAddRequest{
			ParticipantId: pAddResponse.Id,
			PlatformName:  p.MessengerName,
			PlatformId:    p.MessengerID,
			DmChannelId:   p.DmChannelId,
			PlatformLogin: p.MessengerLogin,
			IsFound:       p.IsFound,
		}
		log.Printf("Add request participant Account - Messenger: %v", pAddMessengerRequest)

		if p.MessengerName == "" {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | messenger name is empty")
		}

		_, err = accountsTxUc.AddParticipantAccount(ctx, pAddMessengerRequest)
		if err != nil {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("db | failed to add participant account ID: %v - %v - %v | %v", pAddMessengerRequest.ParticipantId, pAddMessengerRequest.PlatformName, pAddMessengerRequest.PlatformLogin, err)
		}
	} else {
		log.Printf("db | messenger login is empty | account messenger don't added")
	}

	if len(p.TournamentPlatformLogin) != 0 {
		pAddTournamentAccountRequest := entityDB.ParticipantAccountAddRequest{
			ParticipantId: pAddResponse.Id,
			PlatformName:  p.TournamentPlatformName,
			PlatformId:    p.TournamentPlatformID,
			DmChannelId:   p.DmChannelId,
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

	log.Printf("db | successfuly added new participant (ID: %v, Nickname: %v)", pAddResponse.Id, mainNickname)
	log.Printf("Return from AddParticipant - %v", pAddResponse.Id)

	if isBan {
		bansTxUc := db.Bans.WithTx(tx)
		expiresAt := db.CalculateBanUntil(false, 30, "days")
		pAddBanRequest := entityDB.ParticipantBansAddRequest{
			ParticipantId: pAddResponse.Id,
			TypeBan:       "other",
			Reason:        "Import from file",
			ExpiresAt:     expiresAt,
		}
		log.Printf("db | Adding participant ID %v to ban list", pAddResponse.Id)
		_, err := bansTxUc.AddParticipantBan(ctx, pAddBanRequest)
		if err != nil {
			return entityDB.ParticipantAddResponse{}, fmt.Errorf("failed to apply ban for participant: %w", err)
		}
	}

	return pAddResponse, nil
}

func (db *Database) AddParticipants(ctx context.Context, list []entityStartgg.ImportedParticipantContact, isBan bool) (int, int, error) {
	if len(list) == 0 {
		return 0, 0, nil
	}

	log.Println(list)

	tx, err := db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return 0, 0, fmt.Errorf("db | bulk: failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	successful := 0
	for _, data := range list {
		participant := db.ConvertData(data)
		_, err := db.addParticipantWithTx(ctx, tx, participant, isBan)
		if err != nil {
			log.Printf("db | bulk: skipping participant %s due to error: %v", data.Nickname, err)
			continue
		}
		successful++
	}

	if successful > 0 {
		if err := tx.Commit(); err != nil {
			return 0, 0, fmt.Errorf("db | bulk: failed to commit transaction: %w", err)
		}
	}

	total := len(list)
	log.Printf("db | Bulk insert successful. %d participants added", successful)

	return successful, total, nil
}
