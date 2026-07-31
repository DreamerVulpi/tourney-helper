package sender

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"errors"

	entityDB "github.com/dreamervulpi/tourney-helper/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
)

func validationParticipant(p entitySender.Participant) error {
	if p.MessengerID == "" || p.MessengerID == "N/D" {
		return fmt.Errorf("participant has empty messenger ID")
	}

	if p.MessengerLogin == "" || p.MessengerLogin == "N/D" {
		return fmt.Errorf("participant has empty messenger login")
	}

	return nil
}

func (ns *NotificationSystem) checkParticipant(ctx context.Context, apiData entitySender.Participant) (entitySender.Participant, error) {
	dbData, err := ns.Db.GetParticipant(ctx, apiData)

	switch {
	case err == nil:
		if dbData.MessengerID == "" || dbData.MessengerID == "N/D" {
			updated, err := ns.Messenger.FindContactOfParticipant(ctx, dbData)
			if err == nil {
				dbData = updated
			}
		}
		participant, err := ns.Db.SyncParticipant(ctx, apiData, dbData)
		if err != nil {
			return dbData, err
		}
		return participant, nil
	case errors.Is(err, sql.ErrNoRows):
		log.Printf("Process | Player not found in DB, searching in %s...", apiData.MessengerName)

		foundParticipant, err := ns.Messenger.FindContactOfParticipant(ctx, apiData)
		if err != nil {
			log.Printf("Process | Player not found in %s: %v", apiData.MessengerName, err)
			if _, errSave := ns.Db.AddParticipant(ctx, foundParticipant); errSave != nil {
				log.Printf("Process | failed to save player (%v) to DB: %v", foundParticipant.MessengerName, errSave)
			}
			return foundParticipant, err
		}
		if _, errSave := ns.Db.AddParticipant(ctx, foundParticipant); errSave != nil {
			log.Printf("Process | failed to save player (%v) to DB: %v", foundParticipant.MessengerName, errSave)
		}
		return foundParticipant, nil
	default:
		return entitySender.Participant{}, err
	}
}

func (ns *NotificationSystem) saveSentInfo(ctx context.Context, slug string, set entitySender.SetData, timeP1 *time.Time, timeP2 *time.Time) error {
	var currentState entityDB.SetState = entityDB.ConvertToSetState(set.State)
	request := entityDB.SentSetAddRequest{
		SetId:              set.SetID,
		TournamentPlatform: ns.Data.GetPlatformTournamentName(),
		MessengerPlatform:  ns.Messenger.GetPlatformMessengerName(),
		TournamentSlug:     slug,
		State:              entityDB.PointerSetState(currentState),
		SentAtP1:           timeP1,
		SentAtP2:           timeP2,
	}
	_, err := ns.Db.SentSets.AddSentSet(ctx, request)
	return err
}

func (ns *NotificationSystem) shouldSend(lastSent *time.Time) bool {
	// No notifications
	if lastSent == nil {
		return true
	}
	// Sended notification, but more 5 minutes ago
	return time.Since(*lastSent) >= ns.ReminderInterval
}

func (ns *NotificationSystem) countMessages(ctx context.Context, sets []entitySender.SetData) (int64, error) {
	totalMessages := int64(0)
	for _, set := range sets {
		select {
		case <-ctx.Done():
			log.Println("Process | Loop interrupted by context cancellation")
			return 0, ctx.Err()
		default:
		}
		sentInfo, err := ns.Db.SentSets.GetSentSet(ctx, set.SetID)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return 0, err
		}

		var sentAtP1, sentAtP2 *time.Time

		if sentInfo != nil {
			sentAtP1 = sentInfo.SentAtP1
			sentAtP2 = sentInfo.SentAtP2
		}

		p1NeedsSending := ns.shouldSend(sentAtP1)
		p2NeedsSending := ns.shouldSend(sentAtP2)

		if p1NeedsSending {
			totalMessages++
		}
		if p2NeedsSending {
			totalMessages++
		}
	}
	return totalMessages, nil
}
