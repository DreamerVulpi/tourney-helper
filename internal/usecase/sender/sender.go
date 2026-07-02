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

func (ns NotificationSystem) Process(ctx context.Context) error {
	slug, err := ns.Data.GetTournamentSlug()
	if err != nil {
		slug = "N/D"
		log.Printf("process | Warning - %v\n", err)
	}

	sets, err := ns.Data.GetSetsData(ctx, slug)
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

		var sentAtP1, sentAtP2 *time.Time

		if sentInfo != nil {
			sentAtP1 = sentInfo.SentAtP1
			sentAtP2 = sentInfo.SentAtP2
		}

		p1NeedsSending := ns.shouldSend(sentAtP1)
		p2NeedsSending := ns.shouldSend(sentAtP2)

		if !p1NeedsSending && !p2NeedsSending && !ns.DebugMode {
			continue
		}

		log.Printf("set.ContactPlayer1: %v", set.ContactPlayer1)
		contactP1, err := ns.checkParticipant(ctx, set.ContactPlayer1)

		log.Printf("set.ContactPlayer2: %v", set.ContactPlayer2)
		contactP2, err := ns.checkParticipant(ctx, set.ContactPlayer2)

		if ns.DebugMode {
			log.Printf("Debug | Redirecting notification for set %v to test user %v", set.SetID, ns.TestContact.MessenagerLogin)
			ns.sendDebugNotifications(ctx, slug, set, contactP1, contactP2)
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
			timeP1, err = ns.sendNotification(ctx, contactP1, set, timeP1)
			if err != nil {
				log.Println(err)
			}
		}

		if p2NeedsSending && contactP2.IsFound {
			setForP2 := set
			setForP2.ContactPlayer1 = contactP2
			setForP2.ContactPlayer2 = contactP1

			timeP2, err = ns.sendNotification(ctx, contactP2, setForP2, timeP2)
			if err != nil {
				log.Println(err)
			}
		}

		if err := ns.saveSentInfo(ctx, slug, set, timeP1, timeP2); err != nil {
			log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
		}
		time.Sleep(entitySender.NotificationDelay)
	}
	return nil
}
