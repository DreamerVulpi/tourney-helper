package sender

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entityLogger "github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/logger"
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

func (ns NotificationSystem) Run(ctx context.Context) error {
	slug, err := ns.Data.GetTournamentSlug()
	if err != nil {
		slug = "N/D"
		log.Printf("process | Warning - %v\n", err)
	}

	ticker := time.NewTicker(ns.ReminderInterval)
	defer ticker.Stop()

	for {
		logger.Log(entityLogger.Info, "Notification System | Starting process...")
		started := time.Now()
		logger.Log(entityLogger.Info, fmt.Sprintf("Notification System | Cycle started at %s", started.Format("15:04:05")))
		if err := ns.Process(ctx, slug); err != nil {
			if errors.Is(err, context.Canceled) {
				return err
			}
			logger.Log(entityLogger.Error, fmt.Sprintf("Notification System | Error: %v", err))
		}
		logger.Log(entityLogger.Success, fmt.Sprintf("Notification System | Cycle finished in %v", time.Since(started)))
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (ns NotificationSystem) Process(ctx context.Context, slug string) error {
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

		currentState := entityDB.SetState(set.State)
		if sentInfo != nil {
			previousState := sentInfo.State
			if previousState != nil && *previousState != currentState && !ns.DebugMode {
				if err := ns.saveSentInfo(ctx, slug, set, nil, nil); err != nil {
					log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
				}
			}
			if currentState == entityDB.StateCompleted || currentState == entityDB.StateInProgress {
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

		contactP1, errP1 := ns.checkParticipant(ctx, set.ContactPlayer1)
		contactP2, errP2 := ns.checkParticipant(ctx, set.ContactPlayer2)

		if errP1 != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("Player 1 error: %v", errP1))
		}

		if errP2 != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("Player 2 error: %v", errP2))
		}

		if ns.DebugMode {
			log.Printf("Debug | Redirecting notification for set %v to test user %v", set.SetID, ns.TestContact.MessengerLogin)
			ns.sendDebugNotifications(ctx, set, contactP1, contactP2)
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
				log.Printf("Set %d P1 notification failed: %v", set.SetID, err)
			}
		}

		time.Sleep(entitySender.NotificationDelay)

		if p2NeedsSending && contactP2.IsFound {
			setForP2 := set
			setForP2.ContactPlayer1 = contactP2
			setForP2.ContactPlayer2 = contactP1

			timeP2, err = ns.sendNotification(ctx, contactP2, setForP2, timeP2)
			if err != nil {
				log.Printf("Set %d P2 notification failed: %v", set.SetID, err)
			}
		}

		if err := ns.saveSentInfo(ctx, slug, set, timeP1, timeP2); err != nil {
			log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
		}
	}
	return nil
}
