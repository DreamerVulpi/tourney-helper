package sender

import (
	"context"
	"log"
	"time"

	entityDB "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	usecaseDB "github.com/dreamervulpi/tourneyBot/internal/usecase/db"
)

type NotificationSystem struct {
	Messenger     entitySender.NotificationSender
	Data          entitySender.NotificationData
	ParticipantUC usecaseDB.Participant
	SentSetUC     usecaseDB.SentSet
	DebugMode     bool
	TestContact   entitySender.Participant
}

func NewNotificationSystem(s entitySender.NotificationSender, d entitySender.NotificationData) *NotificationSystem {
	return &NotificationSystem{
		Messenger: s,
		Data:      d,
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

		alreadySent, err := p.SentSetUC.IsExists(entityDB.SentSetCheckRequest{SetId: set.SetID})
		if err != nil {
			return err
		}
		if alreadySent.State && !p.DebugMode {
			continue
		}

		contactP1, err1 := p.Messenger.FindContactOfParticipant(ctx, set.ContactPlayer1)
		contactP2, err2 := p.Messenger.FindContactOfParticipant(ctx, set.ContactPlayer2)

		currentTime := time.Now()
		if err1 != nil {
			log.Printf("Process | Player 1 (%s) not found in DB: %v\nSaving to DB...", set.ContactPlayer1.MessenagerLogin, err1)
		}
		if err2 != nil {
			log.Printf("Process | Player 2 (%s) not found in DB: %v\nSaving to DB...", set.ContactPlayer2.MessenagerLogin, err2)
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

		notificationSent := false

		if contactP1.MessenagerID != "" && contactP1.MessenagerID != "N/D" {
			if err := p.Messenger.SendNotification(ctx, contactP1.MessenagerID, set); err == nil {
				notificationSent = true
			} else {
				log.Printf("Process | Can't send notification to %s: %v", contactP1.MessenagerID, err)
			}
		}
		if contactP2.MessenagerID != "" && contactP2.MessenagerID != "N/D" {
			if err := p.Messenger.SendNotification(ctx, contactP2.MessenagerID, set); err == nil {
				notificationSent = true
			} else {
				log.Printf("Process | Can't send notification to %s: %v", contactP2.MessenagerID, err)
			}
		}

		slug, err := p.Data.GetTournamentSlug()
		if err != nil {
			slug = "N/D"
			log.Printf("process | Warning - %v\n", err)
		}

		if notificationSent {
			request := entityDB.SentSetAddRequest{
				SetId:              set.SetID,
				TournamentPlatform: p.Data.GetPlatformTournamentName(),
				MessengerPlatform:  p.Messenger.GetPlatformMessenagerName(),
				TournamentSlug:     slug,
				SentAt:             currentTime,
			}
			_, err := p.SentSetUC.AddSentSet(request)
			if err != nil {
				log.Printf("Process | Can't add set (%v) to DB: %v", set.SetID, err)
			}
		}
		time.Sleep(1500 * time.Millisecond)
	}
	return nil
}

// func (s *NotificationSystem) saveNewParticipant(p Participant, t time.Time) {
// 	locale := "N/D"
// 	if len(p.Locales) > 0 {
// 		locale = p.Locales[0]
// 	}

// 	request := entity.ParticipantAddRequest{
// 		GamerTag:               p.GameNickname,
// 		MessengerPlatform:      p.MessenagerName,
// 		MessengerPlatformId:    p.MessenagerID,
// 		MessengerPlatformLogin: p.MessenagerLogin,
// 		UpdatedAt:              t,
// 		IsFound:                true,
// 		Locale:                 locale,
// 	}

// 	_, err := s.ParticipantUC.AddParticipant(request)
// 	if err != nil {
// 		log.Printf("Process | DB Save Error (%s) to DB: %v", p.MessenagerLogin, err)
// 	}
// }
