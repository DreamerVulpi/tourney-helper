package sender

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"sync/atomic"
	"time"

	entityDB "github.com/dreamervulpi/tourney-helper/internal/entity/db"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/dbManager"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter"
)

type NotificationSystem struct {
	Messenger entitySender.NotificationSender
	Data      entitySender.NotificationData
	Db        *dbManager.Database

	DebugMode   bool
	TestContact entitySender.Participant

	LimiterMessenger *rateLimiter.RateLimiter
	MetricsMessenger *metrics.Collector

	LimiterTournamentPlatform *rateLimiter.RateLimiter
	MetricsTournamentPlatform *metrics.Collector

	ReminderInterval         time.Duration
	MessagesSentCurrentCycle atomic.Int64
	TotalMessages            atomic.Int64
}

func NewNotificationSystem(
	s entitySender.NotificationSender,
	d entitySender.NotificationData,
	db *dbManager.Database,
	mode bool,
	contact entitySender.Participant,
	limiterMessenger *rateLimiter.RateLimiter,
	limiterTournamentPlatform *rateLimiter.RateLimiter,
	metricsMessenger *metrics.Collector,
	metricsTournamentPlatform *metrics.Collector,
	t time.Duration) *NotificationSystem {
	return &NotificationSystem{
		Messenger:                 s,
		Data:                      d,
		Db:                        db,
		DebugMode:                 mode,
		TestContact:               contact,
		ReminderInterval:          t,
		LimiterMessenger:          limiterMessenger,
		LimiterTournamentPlatform: limiterTournamentPlatform,
		MetricsMessenger:          metricsMessenger,
		MetricsTournamentPlatform: metricsTournamentPlatform,
	}
}

func (ns *NotificationSystem) Run(ctx context.Context) error {
	slug, err := ns.Data.GetTournamentSlug()
	if err != nil {
		slug = "N/D"
		logger.Log(entityLogger.Error, fmt.Sprintf("Error after attempt to get tourney slug: %v", err))
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

func (ns *NotificationSystem) processSet(ctx context.Context, slug string, set entitySender.SetData) error {
	select {
	case <-ctx.Done():
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
			if err := ns.SaveSentInfo(ctx, slug, set, nil, nil); err != nil {
				log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
			}
		}
		if currentState == entityDB.StateCompleted || currentState == entityDB.StateInProgress {
			return nil
		}
	}

	var sentAtP1, sentAtP2 *time.Time

	if sentInfo != nil {
		sentAtP1 = sentInfo.SentAtP1
		sentAtP2 = sentInfo.SentAtP2
	}

	p1NeedsSending := ns.ShouldSend(sentAtP1)
	p2NeedsSending := ns.ShouldSend(sentAtP2)

	if !p1NeedsSending && !p2NeedsSending && !ns.DebugMode {
		return nil
	}

	contactP1, errP1 := ns.CheckParticipant(ctx, set.ContactPlayer1)
	contactP2, errP2 := ns.CheckParticipant(ctx, set.ContactPlayer2)

	if errP1 != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Got error after check participant data of P1: %v", errP1))
	}

	if errP2 != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Got error after check participant data of P2: %v", errP2))
	}

	if ns.DebugMode {
		logger.Log(entityLogger.Debug, fmt.Sprintf("Redirecting notification for set %v to test user %v", set.SetID, ns.TestContact.MessengerLogin))
		ns.sendDebugNotifications(ctx, set, contactP1, contactP2)
		return nil
	}

	set.ContactPlayer1 = contactP1
	set.ContactPlayer2 = contactP2

	var timeP1 *time.Time
	var timeP2 *time.Time

	if sentInfo != nil {
		timeP1 = sentInfo.SentAtP1
		timeP2 = sentInfo.SentAtP2
	}

	if p1NeedsSending && errP1 == nil && ValidationParticipant(contactP1) == nil {
		timeP1, err = ns.sendNotification(ctx, contactP1, set, timeP1)
		if err != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("Set %d P1 notification failed to %v. Error: %v", set.SetID, contactP1.GameNickname, err.Error()))
		} else {
			logger.Log(entityLogger.Success, fmt.Sprintf("Set %d P1 notification successful to %v", set.SetID, contactP1.GameNickname))
		}
	}

	if p2NeedsSending && errP2 == nil && ValidationParticipant(contactP2) == nil {
		setForP2 := set
		setForP2.ContactPlayer1 = contactP2
		setForP2.ContactPlayer2 = contactP1

		timeP2, err = ns.sendNotification(ctx, contactP2, setForP2, timeP2)
		if err != nil {
			logger.Log(entityLogger.Error, fmt.Sprintf("Set %d P2 notification failed to %v. Error: %v", set.SetID, contactP2.GameNickname, err.Error()))
		} else {
			logger.Log(entityLogger.Success, fmt.Sprintf("Set %d P2 notification successful to %v", set.SetID, contactP2.GameNickname))
		}
	}

	if err := ns.SaveSentInfo(ctx, slug, set, timeP1, timeP2); err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Process | Can't add set (%v) to DB: %v", set.SetID, err))
	}

	return nil
}

func (ns *NotificationSystem) Process(ctx context.Context, slug string) error {
	sets, err := ns.Data.GetSetsData(ctx, slug)
	if err != nil {
		return err
	}

	total, err := ns.CountMessages(ctx, sets)
	if err != nil {
		logger.Log(entityLogger.Error, "Can't count sets...")
	}
	ns.TotalMessages.Store(total)
	ns.MessagesSentCurrentCycle.Store(0)

	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	if len(sets) == 0 {
		logger.Log(entityLogger.Info, "There are currently no battles with the \"Not Started\" status...")
	}

	for _, set := range sets {
		if err := ns.processSet(ctx, slug, set); err != nil {
			logger.Log(entityLogger.Error, err.Error())
		}
	}

	return nil
}
