package sender

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"errors"

	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

func (ns NotificationSystem) checkParticipant(ctx context.Context, apiData entitySender.Participant) (entitySender.Participant, error) {
	dbData, err := ns.Db.GetParticipant(ctx, apiData)

	switch {
	case err == nil:
		participant, err := ns.Db.SyncParticipant(ctx, apiData, dbData)
		if err != nil {
			return entitySender.Participant{}, err
		}
		return participant, nil
	case errors.Is(err, sql.ErrNoRows):
		log.Printf("Process | Player not found in DB, searching in %s...", apiData.MessenagerName)

		foundParticipant, err := ns.Messenger.FindContactOfParticipant(ctx, apiData)
		if err != nil {
			log.Printf("Process | Player not found in %s: %v", apiData.MessenagerName, err)
			return apiData, err
		}

		if _, errSave := ns.Db.AddParticipant(ctx, foundParticipant); errSave != nil {
			log.Printf("Process | failed to save player (%v) to DB: %v", foundParticipant.MessenagerName, errSave)
		}

		return foundParticipant, nil
	default:
		return entitySender.Participant{}, err
	}
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

	dmChannelIDP1, err := ns.Messenger.SendMessage(ctx, ns.TestContact.MessenagerID, contactP1.DmChannelId, setForP1)
	if err != nil {
		log.Printf("sendNotification | can't send notification to %s: %v", ns.TestContact.MessenagerID, err)
	} else {
		now1 := time.Now()
		timeP1 = &now1
	}

	if contactP1.DmChannelId == nil || *contactP1.DmChannelId != dmChannelIDP1 {
		requestP := entityDB.ParticipantGetRequestByNickname{
			Nickname: contactP1.GameNickname,
		}

		p, _ := ns.Db.Participant.GetParticipantByNickname(ctx, requestP)

		request := entityDB.ParticipantAccoutnEditDMChannelRequest{
			ParticipantId: p.Id,
			PlatformName:  contactP1.MessenagerName,
			DmChannelId:   &dmChannelIDP1,
		}
		log.Printf("REQUEST FOR CHANNEL P1: %v", request)
		if err := ns.Db.Accounts.EditDmChannelParticipantAccount(ctx, request); err != nil {
			log.Printf("sendNotification | can't update DM channel: %v", err)
		}
	}

	dmChannelIDP2, err := ns.Messenger.SendMessage(ctx, ns.TestContact.MessenagerID, contactP2.DmChannelId, setForP2)
	if err != nil {
		log.Printf("sendNotification | can't send notification to %s: %v", ns.TestContact.MessenagerID, err)
	} else {
		now2 := time.Now()
		timeP2 = &now2
	}

	if contactP1.DmChannelId == nil || *contactP1.DmChannelId != dmChannelIDP2 {
		requestP := entityDB.ParticipantGetRequestByNickname{
			Nickname: contactP2.GameNickname,
		}

		p, _ := ns.Db.Participant.GetParticipantByNickname(ctx, requestP)
		request := entityDB.ParticipantAccoutnEditDMChannelRequest{
			ParticipantId: p.Id,
			PlatformName:  contactP2.MessenagerName,
			DmChannelId:   &dmChannelIDP2,
		}
		log.Printf("REQUEST FOR CHANNEL P2: %v", request)
		if err := ns.Db.Accounts.EditDmChannelParticipantAccount(ctx, request); err != nil {
			log.Printf("sendNotification | can't update DM channel: %v", err)
		}
	}

	// if _, err := ns.Messenger.SendMessage(ctx, ns.TestContact.MessenagerID, nil, setForP1); err != nil {
	// 	log.Printf("Debug | Failed to send P1-view: %v", err)
	// } else {
	// 	now1 := time.Now()
	// 	timeP1 = &now1
	// }

	// time.Sleep(entitySender.NotificationDelay)

	// if _, err := ns.Messenger.SendMessage(ctx, ns.TestContact.MessenagerID, nil, setForP2); err != nil {
	// 	log.Printf("Debug | Failed to send P2-view: %v", err)
	// } else {
	// 	now2 := time.Now()
	// 	timeP2 = &now2
	// }

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

	dmChannelID, err := ns.Messenger.SendMessage(ctx, contact.MessenagerID, contact.DmChannelId, set)
	if err != nil {
		return lastSent, fmt.Errorf("sendNotification | Can't send notification to %s: %v", contact.MessenagerID, err)
	}

	if contact.DmChannelId == nil || *contact.DmChannelId != dmChannelID {
		request := entityDB.ParticipantAccoutnEditDMChannelRequest{
			ParticipantId: contact.Id,
			PlatformName:  contact.MessenagerName,
			DmChannelId:   &dmChannelID,
		}
		log.Printf("REQUEST FOR CHANNEL: %v", request)
		if err := ns.Db.Accounts.EditDmChannelParticipantAccount(ctx, request); err != nil {
			log.Printf("sendNotification | can't update DM channel: %v", err)
		}
	}

	now := time.Now()
	return &now, nil
}
