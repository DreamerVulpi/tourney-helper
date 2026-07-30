package sender

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"errors"

	entityDB "github.com/dreamervulpi/tourney-helper/internal/entity/db"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entityMetrics "github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	entityPlatformRules "github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"

	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func (ns *NotificationSystem) GetMessengerMetrics() entityMetrics.Snapshot {
	snapshot := ns.MetricsMessenger.Snapshot()
	remaining := ns.TotalMessages - ns.MessagesSentCurrentCycle
	if remaining < 0 {
		remaining = 0
	}
	snapshot.EstimateRemainingMs = ns.MetricsMessenger.EstimateRemaining(remaining).Milliseconds()
	return snapshot
}

func (ns *NotificationSystem) GetTournamentPlatformMetrics() entityMetrics.Snapshot {
	return ns.MetricsTournamentPlatform.Snapshot()
}

func (ns *NotificationSystem) GetMessengerLimits() entityPlatformRules.Limits {
	return ns.LimiterMessenger.Limits()
}

func (ns *NotificationSystem) GetMessengerMessageLimit() int64 {
	if ns.LimiterMessenger == nil {
		return 0
	}
	limits := ns.LimiterMessenger.Limits()
	if ns.Messenger.IsLogChannelEnabled() {
		return limits.MessagesPerMinute / 2
	}
	return limits.MessagesPerMinute
}

func (ns *NotificationSystem) GetTournamentPlatformLimits() entityPlatformRules.Limits {
	return ns.LimiterTournamentPlatform.Limits()
}

func (ns *NotificationSystem) getDebugDMChannel(ctx context.Context) (string, error) {
	start := time.Now()
	if ns.TestContact.DmChannelId != nil && *ns.TestContact.DmChannelId != "" {
		return *ns.TestContact.DmChannelId, nil
	}

	channel, err := ns.Messenger.CreateDMChannel(ctx, ns.TestContact.MessengerID)
	if err != nil {
		return "", err
	}

	ns.TestContact.DmChannelId = channel
	ns.MetricsMessenger.RecordAPIRequest(err, time.Since(start))
	return *channel, nil
}

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
		if dbData.MessengerID != "" || dbData.MessengerID == "N/D" {
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

func (ns *NotificationSystem) sendDebugNotifications(ctx context.Context, set entitySender.SetData, contactP1, contactP2 entitySender.Participant) {
	setForP1 := set
	setForP2 := set

	setForP1.ContactPlayer1 = contactP1
	setForP1.ContactPlayer2 = contactP2
	setForP1.IsTest = true

	setForP2.ContactPlayer1 = contactP2
	setForP2.ContactPlayer2 = contactP1
	setForP2.IsTest = true

	debugChannelID, err := ns.getDebugDMChannel(ctx)
	if err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Can't get debug DM channel for test contact: %v", ns.TestContact.MessengerLogin))
	}

	// errWaitP1 := ns.LimiterMessenger.Wait(ctx, entityRateLimiter.Operation{
	// 	Type:     entityRateLimiter.OperationMessage,
	// 	Priority: entityRateLimiter.PriorityHigh,
	// 	Cost:     2,
	// })
	// if errWaitP1 != nil {
	// 	logger.Log(entityLogger.Error, errWaitP1.Error())
	// }
	start := time.Now()
	_, errP1 := ns.Messenger.SendMessage(ctx, ns.TestContact.MessengerID, &debugChannelID, setForP1)
	if errP1 != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Set %d P1 notification failed (%v) to test contact: %v. Error: %v", set.SetID, contactP1.GameNickname, ns.TestContact.MessengerLogin, errP1.Error()))
	} else {
		logger.Log(entityLogger.Debug, fmt.Sprintf("Set %d P1 notification successful (%v) to test contact: %v", set.SetID, contactP1.GameNickname, ns.TestContact.MessengerLogin))
	}
	ns.MetricsMessenger.RecordMessageSend(err, time.Since(start))
	ns.MessagesSentCurrentCycle++
	// errWaitP2 := ns.Limiter.Wait(ctx, entityRateLimiter.Operation{
	// 	Type:     entityRateLimiter.OperationMessage,
	// 	Priority: entityRateLimiter.PriorityHigh,
	// 	Cost:     2,
	// })
	// if errWaitP2 != nil {
	// 	logger.Log(entityLogger.Error, errWaitP2.Error())
	// }

	start2 := time.Now()
	time.Sleep(entitySender.NotificationDelay)

	_, errP2 := ns.Messenger.SendMessage(ctx, ns.TestContact.MessengerID, &debugChannelID, setForP2)
	if errP2 != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("Set %d P2 notification failed (%v) to test contact: %v. Error: %v", set.SetID, contactP2.GameNickname, ns.TestContact.MessengerLogin, errP2.Error()))
	} else {
		logger.Log(entityLogger.Debug, fmt.Sprintf("Set %d P2 notification successful (%v) to test contact: %v", set.SetID, contactP2.GameNickname, ns.TestContact.MessengerLogin))
	}
	ns.MetricsMessenger.RecordMessageSend(err, time.Since(start2))
	ns.MessagesSentCurrentCycle++
}

func (ns *NotificationSystem) shouldSend(lastSent *time.Time) bool {
	// No notifications
	if lastSent == nil {
		return true
	}
	// Sended notification, but more 5 minutes ago
	return time.Since(*lastSent) >= ns.ReminderInterval
}

func (ns *NotificationSystem) sendNotification(ctx context.Context, contact entitySender.Participant, set entitySender.SetData, lastSent *time.Time) (*time.Time, error) {
	if contact.MessengerID == "" || contact.MessengerID == "N/D" {
		return lastSent, fmt.Errorf("sendNotification | Can't send notification to %s: MessengerID is empty", contact.GameNickname)
	}

	if err := ctx.Err(); err != nil {
		log.Println("sendNotification | Cancel context. Breaking process...")
		return lastSent, fmt.Errorf("sendNotification | %w", err)
	}

	dmChannelID, err := ns.Messenger.SendMessage(ctx, contact.MessengerID, contact.DmChannelId, set)
	if err != nil {
		return lastSent, fmt.Errorf("sendNotification | Can't send notification to %s: %v", contact.MessengerID, err)
	}

	if contact.DmChannelId == nil || *contact.DmChannelId != dmChannelID {
		request := entityDB.ParticipantAccoutnEditDMChannelRequest{
			ParticipantId: contact.Id,
			PlatformName:  contact.MessengerName,
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
