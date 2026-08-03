package sender_test

import (
	"context"
	"testing"

	"time"

	"errors"

	entityDB "github.com/dreamervulpi/tourney-helper/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/db"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/dbManager"
	usecaseSender "github.com/dreamervulpi/tourney-helper/internal/usecase/sender"
)

func TestSaveSentInfo_Success(t *testing.T) {
	repo := &fakeSentSetRepo{
		sent: map[int64]entityDB.SentSet{},
	}

	ns := &usecaseSender.NotificationSystem{
		Data: fakeNotificationData{
			name: "Startgg",
		},
		Messenger: fakeNotificationSender{
			name: "Discord",
		},
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: repo,
			},
		},
	}

	timeP1 := time.Now()
	timeP2 := time.Now().Add(time.Minute)

	err := ns.SaveSentInfo(
		context.Background(),
		"tournament/test/event/test",
		entitySender.SetData{
			SetID: 100,
			State: 2,
		},
		&timeP1,
		&timeP2,
	)

	if err != nil {
		t.Fatalf(
			"unexpected error: %v",
			err,
		)
	}

	if !repo.addCalled {
		t.Fatal("expected AddSentSet to be called")
	}

	if repo.addRequest.SetId != 100 {
		t.Fatalf(
			"expected set id 100, got %d",
			repo.addRequest.SetId,
		)
	}

	if repo.addRequest.TournamentPlatform != "Startgg" {
		t.Fatalf(
			"unexpected tournament platform: %s",
			repo.addRequest.TournamentPlatform,
		)
	}

	if repo.addRequest.MessengerPlatform != "Discord" {
		t.Fatalf(
			"unexpected messenger platform: %s",
			repo.addRequest.MessengerPlatform,
		)
	}

	if repo.addRequest.TournamentSlug != "tournament/test/event/test" {
		t.Fatalf(
			"unexpected slug: %s",
			repo.addRequest.TournamentSlug,
		)
	}

	if repo.addRequest.SentAtP1 == nil || repo.addRequest.SentAtP2 == nil {
		t.Fatal("expected sent timestamps")
	}
}

func TestSaveSentInfo_NilTimes(t *testing.T) {
	repo := &fakeSentSetRepo{
		sent: map[int64]entityDB.SentSet{},
	}

	ns := &usecaseSender.NotificationSystem{
		Data: &fakeNotificationData{
			name: "Startgg",
		},
		Messenger: &fakeNotificationSender{
			name: "Discord",
		},
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: repo,
			},
		},
	}

	err := ns.SaveSentInfo(
		context.Background(),
		"slug",
		entitySender.SetData{
			SetID: 10,
			State: 1,
		},
		nil,
		nil,
	)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if repo.addRequest.SentAtP1 != nil {
		t.Fatal("expected SentAtP1 to be nil")
	}

	if repo.addRequest.SentAtP2 != nil {
		t.Fatal("expected SentAtP2 to be nil")
	}
}

func TestSaveSentInfo_StateConversion(t *testing.T) {
	repo := &fakeSentSetRepo{
		sent: map[int64]entityDB.SentSet{},
	}

	ns := &usecaseSender.NotificationSystem{
		Data: &fakeNotificationData{
			name: "Startgg",
		},
		Messenger: &fakeNotificationSender{
			name: "Discord",
		},
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: repo,
			},
		},
	}

	err := ns.SaveSentInfo(
		context.Background(),
		"slug",
		entitySender.SetData{
			SetID: 15,
			State: 2,
		},
		nil,
		nil,
	)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if repo.addRequest.State == nil {
		t.Fatal("expected state")
	}

	expected := entityDB.ConvertToSetState(2)

	if *repo.addRequest.State != expected {
		t.Fatalf(
			"expected state %v, got %v",
			expected,
			*repo.addRequest.State,
		)
	}
}

func TestSaveSentInfo_Error(t *testing.T) {
	repo := &fakeSentSetRepo{
		err: errors.New("database error"),
	}

	ns := &usecaseSender.NotificationSystem{
		Data: &fakeNotificationData{
			name: "Startgg",
		},
		Messenger: &fakeNotificationSender{
			name: "Discord",
		},
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: repo,
			},
		},
	}

	err := ns.SaveSentInfo(
		context.Background(),
		"tournament/test/event/test",
		entitySender.SetData{
			SetID: 100,
			State: 2,
		},
		nil,
		nil,
	)

	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err.Error() != "database error" {
		t.Fatalf(
			"expected database error, got %v",
			err,
		)
	}
}
