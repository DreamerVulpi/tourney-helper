package sender

import (
	"context"
	"fmt"
	"log"
	"time"

	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

func (ns NotificationSystem) checkParticipant(ctx context.Context, contact entitySender.Participant) (entitySender.Participant, error) {
	participant, err := ns.Db.GetParticipant(ctx, contact)
	if err == nil {
		return participant, nil
	}
	log.Printf("Process | Player not found in DB, searching in %s...", contact.MessenagerName)

	foundParticipant, err := ns.Messenger.FindContactOfParticipant(ctx, contact)
	if err != nil {
		log.Printf("Process | Player not found in %s: %v", contact.MessenagerName, err)
		return contact, err
	}

	if _, errSave := ns.Db.AddParticipant(ctx, foundParticipant); errSave != nil {
		log.Printf("Process | failed to save player (%v) to DB: %v", foundParticipant.MessenagerName, errSave)
	}

	log.Printf("set.ContactPlayer: %v", contact)
	return foundParticipant, err
}

func (ns NotificationSystem) saveSentInfo(ctx context.Context, slug string, set entitySender.SetData, timeP1 *time.Time, timeP2 *time.Time) error {
	var currentState entityDB.SetState = entityDB.ConvertToSetState(set.State)
	request := entityDB.SentSetAddRequest{
		SetId:              set.SetID,
		TournamentPlatform: ns.Data.GetPlatformTournamentName(),
		MessengerPlatform:  ns.Messenger.GetPlatformMessenagerName(),
		TournamentSlug:     slug,
		State:              entityDB.PointerSetState(currentState),
		SentAtP1:           timeP1,
		SentAtP2:           timeP2,
	}
	_, err := ns.Db.SentSets.AddSentSet(ctx, request)
	return err
}

func (ns NotificationSystem) sendDebugNotifications(ctx context.Context, slug string, set entitySender.SetData, contactP1, contactP2 entitySender.Participant) {
	setForP1 := set
	setForP2 := set

	setForP1.ContactPlayer1 = contactP1
	setForP1.ContactPlayer2 = contactP2
	setForP1.IsTest = true

	setForP2.ContactPlayer1 = contactP2
	setForP2.ContactPlayer2 = contactP1
	setForP2.IsTest = true

	var timeP1 *time.Time
	var timeP2 *time.Time

	if err := ns.Messenger.SendMessage(ctx, ns.TestContact.MessenagerID, setForP1); err != nil {
		log.Printf("Debug | Failed to send P1-view: %v", err)
	} else {
		now1 := time.Now()
		timeP1 = &now1
	}

	time.Sleep(entitySender.NotificationDelay)

	if err := ns.Messenger.SendMessage(ctx, ns.TestContact.MessenagerID, setForP2); err != nil {
		log.Printf("Debug | Failed to send P2-view: %v", err)
	} else {
		now2 := time.Now()
		timeP2 = &now2
	}

	if err := ns.saveSentInfo(ctx, slug, set, timeP1, timeP2); err != nil {
		log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
	}
}

func (ns NotificationSystem) shouldSend(lastSent *time.Time) bool {
	// No notifications
	if lastSent == nil {
		return true
	}
	// Sended notification, but more 5 minutes ago
	return time.Since(*lastSent) >= ns.ReminderInterval
}

func (ns NotificationSystem) sendNotification(ctx context.Context, contact entitySender.Participant, set entitySender.SetData, lastSent *time.Time) (*time.Time, error) {
	if contact.MessenagerID == "" || contact.MessenagerID == "N/D" {
		return lastSent, fmt.Errorf("sendNotification | Can't send notification to %s: MessengerID is empty", contact.GameNickname)
	}

	if err := ctx.Err(); err != nil {
		log.Println("sendNotification | Cancel context. Breaking process...")
		return lastSent, fmt.Errorf("sendNotification | %w", err)
	}

	if err := ns.Messenger.SendMessage(ctx, contact.MessenagerID, set); err != nil {
		return lastSent, fmt.Errorf("sendNotification | Can't send notification to %s: %w", contact.MessenagerID, err)
	}

	now := time.Now()
	return &now, nil
}
