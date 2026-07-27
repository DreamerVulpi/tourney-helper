package dbManager

import (
	"context"

	entityDB "github.com/dreamervulpi/tourney-helper/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
)

func shouldReplace(api, db string) bool {
	return api != "" && api != "N/D" && api != db
}

func shouldFill(api, db string) bool {
	return (db == "" || db == "N/D") && api != "" && api != "N/D"
}

func (db *Database) syncParticipant(ctx context.Context, api, database entitySender.Participant) error {
	request := entityDB.ParticipantEditRequest{
		Id:       database.Id,
		Nickname: database.GameNickname,
		Region:   database.Region,
		Locale:   database.Locale,
	}
	needUpdate := false

	if shouldReplace(api.GameNickname, database.GameNickname) {
		request.Nickname = api.GameNickname
		needUpdate = true
	}
	if shouldFill(api.Region, database.Region) {
		request.Region = api.Region
		needUpdate = true
	}
	if shouldReplace(api.Locale, database.Locale) {
		request.Locale = api.Locale
		needUpdate = true
	}

	if needUpdate {
		_, err := db.Participant.EditParticipant(ctx, request)
		if err != nil {
			return err
		}
	}

	return nil
}
func (db *Database) syncMessengerAccount(ctx context.Context, api, database entitySender.Participant) error {
	request := entityDB.ParticipantAccountEditRequest{
		ParticipantId: database.Id,
		PlatformName:  database.MessengerName,
		PlatformId:    database.MessengerID,
		DmChannelId:   database.DmChannelId,
		PlatformLogin: database.MessengerLogin,
		IsFound:       database.IsFound,
	}
	needUpdate := false

	if shouldReplace(api.MessengerID, database.MessengerID) {
		request.PlatformId = api.MessengerID
		needUpdate = true
	}

	if shouldReplace(api.MessengerLogin, database.MessengerLogin) {
		request.PlatformLogin = api.MessengerLogin
		needUpdate = true
	}

	if needUpdate {
		_, err := db.Accounts.EditParticipantAccount(ctx, request)
		if err != nil {
			return err
		}
	}

	return nil
}
func (db *Database) syncTournamentAccount(ctx context.Context, api, database entitySender.Participant) error {
	request := entityDB.ParticipantAccountEditRequest{
		ParticipantId: database.Id,
		PlatformName:  database.TournamentPlatformName,
		PlatformId:    database.TournamentPlatformID,
		DmChannelId:   database.DmChannelId,
		PlatformLogin: database.TournamentPlatformLogin,
		IsFound:       database.IsFound,
	}
	needUpdate := false

	if shouldFill(api.TournamentPlatformID, database.TournamentPlatformID) {
		request.PlatformId = api.TournamentPlatformID
		needUpdate = true
	}

	if shouldReplace(api.TournamentPlatformLogin, database.TournamentPlatformLogin) {
		request.PlatformLogin = api.TournamentPlatformLogin
		needUpdate = true
	}

	if needUpdate {
		_, err := db.Accounts.EditParticipantAccount(ctx, request)
		if err != nil {
			return err
		}
	}

	return nil
}
func (db *Database) syncStats(ctx context.Context, api, database entitySender.Participant) error {
	request := entityDB.ParticipantStatEditRequest{
		ParticipantId: database.Id,
		GameName:      database.GameName,
		GameId:        database.GameID,
		Rating:        database.Rating,
	}
	needUpdate := false

	if shouldReplace(api.GameID, database.GameID) {
		request.GameId = api.GameID
		needUpdate = true
	}

	if needUpdate {
		_, err := db.Stats.EditParticipantStats(ctx, request)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *Database) SyncParticipant(ctx context.Context, api, database entitySender.Participant) (entitySender.Participant, error) {
	errParticipant := db.syncParticipant(ctx, api, database)
	errMessenger := db.syncMessengerAccount(ctx, api, database)
	errTournamentAccount := db.syncTournamentAccount(ctx, api, database)
	errStats := db.syncStats(ctx, api, database)

	if errParticipant != nil {
		return entitySender.Participant{}, errParticipant
	}

	if errMessenger != nil {
		return entitySender.Participant{}, errMessenger
	}

	if errTournamentAccount != nil {
		return entitySender.Participant{}, errTournamentAccount
	}

	if errStats != nil {
		return entitySender.Participant{}, errStats
	}

	updated, err := db.GetParticipant(ctx, api)
	if err != nil {
		return database, err
	}

	return updated, nil
}
