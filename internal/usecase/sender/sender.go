package sender

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/dbManager"
)

type NotificationSystem struct {
	Messenger   entitySender.NotificationSender
	Data        entitySender.NotificationData
	Db          *dbManager.Database
	DebugMode   bool
	TestContact entitySender.Participant
}

func NewNotificationSystem(
	s entitySender.NotificationSender,
	d entitySender.NotificationData,
	db *dbManager.Database,
	mode bool,
	contact entitySender.Participant) *NotificationSystem {
	return &NotificationSystem{
		Messenger:   s,
		Data:        d,
		Db:          db,
		DebugMode:   mode,
		TestContact: contact,
	}
}

func (p NotificationSystem) Process(ctx context.Context) error {
	sets, err := p.Data.GetSetsData(ctx)
	if err != nil {
		return err
	}

	for _, set := range sets {
		select {
		case <-ctx.Done():
			log.Println("Process | Loop interrupted by context cancellation")
			return ctx.Err()
		default:
		}

		sentInfo, err := p.Db.SentSets.GetSentSet(ctx, set.SetID)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}

		p1NeedsSending := sentInfo == nil || sentInfo.SentAtP1 == nil
		p2NeedsSending := sentInfo == nil || sentInfo.SentAtP2 == nil

		if !p1NeedsSending && !p2NeedsSending && !p.DebugMode {
			continue
		}

		contactP1, err := p.Db.GetParticipant(ctx, set.ContactPlayer1)
		if err != nil {
			log.Printf("Process | P1 not found in DB, searching in %s...", set.ContactPlayer1.MessenagerName)
			contactP1, err = p.Messenger.FindContactOfParticipant(ctx, set.ContactPlayer1)
			if err != nil {
				log.Printf("Process | P1 not found in %s...", set.ContactPlayer1.MessenagerName)
			} else {
				if err := p.Db.AddParticipant(ctx, contactP1); err != nil {
					log.Printf("Process | failed to save P1 (%v) to DB: %v", set.ContactPlayer1.MessenagerName, err)
				}
			}
		}
		contactP2, err := p.Db.GetParticipant(ctx, set.ContactPlayer2)
		if err != nil {
			log.Printf("Process | P2 not found in DB, searching in %s...", set.ContactPlayer2.MessenagerName)
			contactP2, err = p.Messenger.FindContactOfParticipant(ctx, set.ContactPlayer2)
			if err != nil {
				log.Printf("Process | P2 not found in %s...", set.ContactPlayer2.MessenagerName)
			} else {
				if err := p.Db.AddParticipant(ctx, contactP2); err != nil {
					log.Printf("Process | failed to save P2 (%v) to DB: %v", set.ContactPlayer2.MessenagerName, err)
				}
			}
		}

		if p.DebugMode {
			log.Printf("Debug | Redirecting notification for set %v to test user %v", set.SetID, p.TestContact.MessenagerLogin)

			setForP1 := set
			setForP2 := set

			setForP1.ContactPlayer1 = contactP1
			setForP1.ContactPlayer2 = contactP2
			setForP1.IsTest = true

			setForP2.ContactPlayer1 = contactP2
			setForP2.ContactPlayer2 = contactP1
			setForP2.IsTest = true

			if err := p.Messenger.SendNotification(ctx, p.TestContact.MessenagerID, setForP1); err != nil {
				log.Printf("Debug | Failed to send P1-view: %v", err)
			}

			time.Sleep(1500 * time.Millisecond)

			if err := p.Messenger.SendNotification(ctx, p.TestContact.MessenagerID, setForP2); err != nil {
				log.Printf("Debug | Failed to send P2-view: %v", err)
			}

			continue
		}

		set.ContactPlayer1 = contactP1
		set.ContactPlayer2 = contactP2

		var timeP1 *time.Time
		var timeP2 *time.Time

		if sentInfo != nil {
			timeP1 = sentInfo.SentAtP1
			timeP2 = sentInfo.SentAtP2
		}

		if p1NeedsSending && contactP1.IsFound {
			if contactP1.MessenagerID != "" && contactP1.MessenagerID != "N/D" {
				if err := p.Messenger.SendNotification(ctx, contactP1.MessenagerID, set); err == nil {
					now := time.Now()
					timeP1 = &now
				} else {
					log.Printf("Process | Can't send notification to %s: %v", contactP1.MessenagerID, err)
					timeP1 = nil
				}
			} else {
				log.Printf("Process | Can't send notification to %s: MessengerID is empty", contactP1.GameNickname)
				timeP1 = nil
			}
		}

		if p2NeedsSending && contactP2.IsFound {
			setForP2 := set
			setForP2.ContactPlayer1 = contactP2
			setForP2.ContactPlayer2 = contactP1

			if contactP2.MessenagerID != "" && contactP2.MessenagerID != "N/D" {
				if err := p.Messenger.SendNotification(ctx, contactP2.MessenagerID, setForP2); err == nil {
					now := time.Now()
					timeP2 = &now
				} else {
					log.Printf("Process | Can't send notification to %s: %v", contactP2.MessenagerID, err)
					timeP2 = nil
				}
			} else {
				log.Printf("Process | Can't send notification to %s: MessengerID is empty", contactP2.GameNickname)
				timeP2 = nil
			}
		}

		slug, err := p.Data.GetTournamentSlug()
		if err != nil {
			slug = "N/D"
			log.Printf("process | Warning - %v\n", err)
		}

		request := entityDB.SentSetAddRequest{
			SetId:              set.SetID,
			TournamentPlatform: p.Data.GetPlatformTournamentName(),
			MessengerPlatform:  p.Messenger.GetPlatformMessenagerName(),
			TournamentSlug:     slug,
			SentAtP1:           timeP1,
			SentAtP2:           timeP2,
		}
		_, err = p.Db.SentSets.AddSentSet(ctx, request)
		if err != nil {
			log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
		}
		time.Sleep(1500 * time.Millisecond)
	}
	return nil
}
