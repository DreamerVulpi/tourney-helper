package dbManager

import (
	"context"
	"time"

	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	entityStartgg "github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func (_ *Database) ConvertData(data entityStartgg.ImportedParticipantContact) entitySender.Participant {
	return entitySender.Participant{
		MessengerLogin:          data.MessengerLogin,
		MessengerName:           data.MessengerName,
		MessengerID:             data.MessengerID,
		TournamentPlatformName:  data.TournamentPlatformName,
		TournamentPlatformLogin: data.TournamentPlatformLogin,
		TournamentPlatformID:    data.TournamentPlatformId,
		GameName:                data.GameName,
		GameNickname:            data.Nickname,
		GameID:                  data.GameId,
		Region:                  data.Region,
		Locale:                  data.Locale,
		Rating:                  data.Rating,
	}
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

func (db *Database) RemoveExpiredBans(ctx context.Context) error {
	err := db.Bans.DeleteExpiredBans(ctx)
	if err != nil {
		return err
	}
	return nil
}
