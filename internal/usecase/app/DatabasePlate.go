package application

import (
	"log"

	"github.com/dreamervulpi/tourneyBot/internal/entity/db"
	"github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

// REFACTOR

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
	tournamentPlatformLogin string) error {
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

	err := a.Db.AddParticipant(a.ctx, p)
	if err != nil {
		return err
	}
	return nil
}

func (a *App) GetParticipants(messengerName, tournamentPlatformName, gameName string, limit, offset int, search string) (db.ParticipantGetParticipantsListWithTotalCountResponse, error) {
	log.Printf("Request: %v %v %v Limit = %v, Offset = %v, Search = \"%v\"", messengerName, tournamentPlatformName, gameName, limit, offset, search)
	result, err := a.Db.GetParticipants(a.ctx, messengerName, tournamentPlatformName, gameName, limit, offset, search)
	if err != nil {
		return db.ParticipantGetParticipantsListWithTotalCountResponse{}, err
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

func (a *App) EditParticipant(
	id int,
	nickname string,
	gameId string,
	gameName string,
	region string,
	locale string,
	rating int,
	messengerName string,
	messengerLogin string,
	tournamentPlatformName string,
	tournamentPlatformLogin string) error {
	log.Printf("Request: %v %v %v %v %v | Rating: %v | %v %v %v %v", nickname, gameId, gameName, region, locale, rating, messengerName, messengerLogin, tournamentPlatformName, tournamentPlatformLogin)
	p := sender.Participant{
		Id:                      id,
		MessenagerLogin:         messengerLogin,
		MessenagerName:          messengerName,
		TournamentPlatformName:  tournamentPlatformName,
		TournamentPlatformLogin: tournamentPlatformLogin,
		GameName:                gameName,
		GameNickname:            nickname,
		GameID:                  gameId,
		Region:                  region,
		Locale:                  locale,
		Rating:                  rating,
	}

	err := a.Db.EditParticipant(a.ctx, p)
	if err != nil {
		return err
	}
	return err
}

// TODO:
func (a *App) BanParticipant(id int, type_ban string, reason string) error {
	return nil
}

// TODO:

func (a *App) DeleteParticipant(id int) error {
	return nil
}
