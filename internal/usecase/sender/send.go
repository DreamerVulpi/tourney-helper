package sender

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	entityDB "github.com/dreamervulpi/tourney-helper/internal/entity/db"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entityRateLimiter "github.com/dreamervulpi/tourney-helper/internal/entity/rateLimiter"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"

	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func (ns *NotificationSystem) sendDebugNotifications(ctx context.Context, set entitySender.SetData, contactP1, contactP2 entitySender.Participant) {
	if ctx.Err() != nil {
		return
	}

	setForP1 := set
	setForP2 := set

	setForP1.ContactPlayer1 = contactP1
	setForP1.ContactPlayer2 = contactP2
	setForP1.IsTest = true

	setForP2.ContactPlayer1 = contactP2
	setForP2.ContactPlayer2 = contactP1
	setForP2.IsTest = true

	t := time.Now()
	debugChannelID, err := ns.getDebugDMChannel(ctx)
	if err != nil && !errors.Is(err, context.Canceled) {
		logger.Log(entityLogger.Error, fmt.Sprintf("Can't get debug DM channel for test contact: %v", ns.TestContact.MessengerLogin))
		return
	}

	errWaitP1 := ns.LimiterMessenger.Wait(ctx, entityRateLimiter.Operation{
		Type:     entityRateLimiter.OperationMessage,
		Priority: entityRateLimiter.PriorityHigh,
		Cost:     1,
	})
	if errWaitP1 != nil {
		logger.Log(entityLogger.Error, errWaitP1.Error())
		return
	}

	_, errP1 := ns.Messenger.SendMessage(ctx, ns.TestContact.MessengerID, &debugChannelID, setForP1)
	if errP1 != nil && !errors.Is(errP1, context.Canceled) {
		logger.Log(entityLogger.Error, fmt.Sprintf("Set %d P1 notification failed (%v) to test contact: %v. Error: %v", set.SetID, contactP1.GameNickname, ns.TestContact.MessengerLogin, errP1.Error()))
	}
	if errP1 == nil {
		logger.Log(entityLogger.Debug, fmt.Sprintf("Set %d P1 notification successful (%v) to test contact: %v", set.SetID, contactP1.GameNickname, ns.TestContact.MessengerLogin))
	}
	ns.MetricsMessenger.RecordMessageSend(errP1, time.Since(t))
	ns.MessagesSentCurrentCycle.Add(1)

	t = time.Now()
	errWaitP2 := ns.LimiterMessenger.Wait(ctx, entityRateLimiter.Operation{
		Type:     entityRateLimiter.OperationMessage,
		Priority: entityRateLimiter.PriorityHigh,
		Cost:     1,
	})
	if errWaitP2 != nil {
		logger.Log(entityLogger.Error, errWaitP2.Error())
		return
	}

	_, errP2 := ns.Messenger.SendMessage(ctx, ns.TestContact.MessengerID, &debugChannelID, setForP2)
	if errP2 != nil && !errors.Is(errP2, context.Canceled) {
		logger.Log(entityLogger.Error, fmt.Sprintf("Set %d P2 notification failed (%v) to test contact: %v. Error: %v", set.SetID, contactP2.GameNickname, ns.TestContact.MessengerLogin, errP2.Error()))
	}
	if errP2 == nil {
		logger.Log(entityLogger.Debug, fmt.Sprintf("Set %d P2 notification successful (%v) to test contact: %v", set.SetID, contactP2.GameNickname, ns.TestContact.MessengerLogin))
	}
	ns.MetricsMessenger.RecordMessageSend(errP2, time.Since(t))
	ns.MessagesSentCurrentCycle.Add(1)
}

func (ns *NotificationSystem) sendNotification(ctx context.Context, contact entitySender.Participant, set entitySender.SetData, lastSent *time.Time) (*time.Time, error) {
	if err := ctx.Err(); err != nil {
		log.Println("sendNotification | Cancel context. Breaking process...")
		return lastSent, fmt.Errorf("sendNotification | %w", err)
	}

	if contact.MessengerID == "" || contact.MessengerID == "N/D" {
		return lastSent, fmt.Errorf("sendNotification | Can't send notification to %s: MessengerID is empty", contact.GameNickname)
	}

	dmChannelID, err := ns.Messenger.SendMessage(ctx, contact.MessengerID, contact.DmChannelId, set)
	if err != nil && !errors.Is(err, context.Canceled) {
		return lastSent, fmt.Errorf("sendNotification | Can't send notification to %s: %v", contact.MessengerID, err)
	}

	if contact.DmChannelId == nil || *contact.DmChannelId != dmChannelID {
		request := entityDB.ParticipantAccoutnEditDMChannelRequest{
			ParticipantId: contact.Id,
			PlatformName:  contact.MessengerName,
			DmChannelId:   &dmChannelID,
		}
		if err := ns.Db.Accounts.EditDmChannelParticipantAccount(ctx, request); err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("sendNotification | can't update DM channel: %v", err)
		}
	}

	now := time.Now()
	return &now, nil
}
