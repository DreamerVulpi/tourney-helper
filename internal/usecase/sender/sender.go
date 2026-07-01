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
	Messenger        entitySender.NotificationSender
	Data             entitySender.NotificationData
	Db               *dbManager.Database
	DebugMode        bool
	TestContact      entitySender.Participant
	ReminderInterval time.Duration
}

func NewNotificationSystem(
	s entitySender.NotificationSender,
	d entitySender.NotificationData,
	db *dbManager.Database,
	mode bool,
	contact entitySender.Participant,
	t time.Duration) *NotificationSystem {
	return &NotificationSystem{
		Messenger:        s,
		Data:             d,
		Db:               db,
		DebugMode:        mode,
		TestContact:      contact,
		ReminderInterval: t,
	}
}

func (ns NotificationSystem) checkParticipant(ctx context.Context, contact entitySender.Participant) (entitySender.Participant, error) {
	participant, err := ns.Db.GetParticipant(ctx, contact)
	if err == nil {
		return participant, nil
	}
	log.Printf("Process | Player not found in DB, searching in %s...", contact.MessenagerName)

	foundParticipant, err := ns.Messenger.FindContactOfParticipant(ctx, contact)
	if err != nil {
		log.Printf("Process | Pplayer not found in %s: %v", contact.MessenagerName, err)
		return contact, err
	}

	if _, errSave := ns.Db.AddParticipant(ctx, foundParticipant); errSave != nil {
		log.Printf("Process | failed to save player (%v) to DB: %v", foundParticipant.MessenagerName, errSave)
	}

	return foundParticipant, err
}

func (ns NotificationSystem) Process(ctx context.Context) error {
	sets, err := ns.Data.GetSetsData(ctx)
	if err != nil {
		return err
	}

	slug, err := ns.Data.GetTournamentSlug()
	if err != nil {
		slug = "N/D"
		log.Printf("process | Warning - %v\n", err)
	}

	for _, set := range sets {
		select {
		case <-ctx.Done():
			log.Println("Process | Loop interrupted by context cancellation")
			return ctx.Err()
		default:
		}

		sentInfo, err := ns.Db.SentSets.GetSentSet(ctx, set.SetID)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}

		if sentInfo != nil && sentInfo.State != nil {
			sentState := *sentInfo.State
			if sentState == entityDB.StateCompleted || *sentInfo.State == entityDB.StateInProgress {
				continue
			}
		}

		p1NeedsSending := false
		if sentInfo == nil || sentInfo.SentAtP1 == nil {
			// No notifications
			p1NeedsSending = true
		} else if time.Since(*sentInfo.SentAtP1) >= ns.ReminderInterval {
			// Sended notification, but more 5 minutes ago
			p1NeedsSending = true
		}

		p2NeedsSending := false
		if sentInfo == nil || sentInfo.SentAtP2 == nil {
			// No notifications
			p2NeedsSending = true
		} else if time.Since(*sentInfo.SentAtP2) >= ns.ReminderInterval {
			// Sended notification, but more 5 minutes ago
			p2NeedsSending = true
		}

		if !p1NeedsSending && !p2NeedsSending && !ns.DebugMode {
			continue
		}

		log.Printf("set.ContactPlayer1: %v", set.ContactPlayer1)
		contactP1, err := ns.checkParticipant(ctx, set.ContactPlayer1)

		log.Printf("set.ContactPlayer2: %v", set.ContactPlayer2)
		contactP2, err := ns.checkParticipant(ctx, set.ContactPlayer2)

		if ns.DebugMode {
			log.Printf("Debug | Redirecting notification for set %v to test user %v", set.SetID, ns.TestContact.MessenagerLogin)

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

			if err := ns.Messenger.SendNotification(ctx, ns.TestContact.MessenagerID, setForP1); err != nil {
				log.Printf("Debug | Failed to send P1-view: %v", err)
			}
			now1 := time.Now()
			timeP1 = &now1
			time.Sleep(1500 * time.Millisecond)

			if err := ns.Messenger.SendNotification(ctx, ns.TestContact.MessenagerID, setForP2); err != nil {
				log.Printf("Debug | Failed to send P2-view: %v", err)
			}

			now2 := time.Now()
			timeP2 = &now2

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
			_, err = ns.Db.SentSets.AddSentSet(ctx, request)
			if err != nil {
				log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
			}
			time.Sleep(1500 * time.Millisecond)

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
				if err := ctx.Err(); err != nil {
					log.Println("Process | Cancel context. Breaking process...")
					return err
				}

				if err := ns.Messenger.SendNotification(ctx, contactP1.MessenagerID, set); err == nil {
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
				if err := ctx.Err(); err != nil {
					log.Println("Process | Cancel context. Breaking process...")
					return err
				}
				if err := ns.Messenger.SendNotification(ctx, contactP2.MessenagerID, setForP2); err == nil {
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
		_, err = ns.Db.SentSets.AddSentSet(ctx, request)
		if err != nil {
			log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
		}
		time.Sleep(1500 * time.Millisecond)
	}
	return nil
}
