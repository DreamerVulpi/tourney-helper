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

func TestValidationParticipant(t *testing.T) {
	tests := []struct {
		name    string
		input   entitySender.Participant
		wantErr bool
	}{
		{
			name: "valid participant",
			input: entitySender.Participant{
				MessengerID:    "123",
				MessengerLogin: "player",
			},
			wantErr: false,
		},
		{
			name: "empty messenger id",
			input: entitySender.Participant{
				MessengerID:    "",
				MessengerLogin: "player",
			},
			wantErr: true,
		},
		{
			name: "unknown messenger id",
			input: entitySender.Participant{
				MessengerID:    "N/D",
				MessengerLogin: "player",
			},
			wantErr: true,
		},
		{
			name: "empty messenger login",
			input: entitySender.Participant{
				MessengerID:    "123",
				MessengerLogin: "",
			},
			wantErr: true,
		},
		{
			name: "unknown messenger login",
			input: entitySender.Participant{
				MessengerID:    "123",
				MessengerLogin: "N/D",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := usecaseSender.ValidationParticipant(tt.input)

			if tt.wantErr && err == nil {
				t.Fatal("expected error, got nil")
			}

			if !tt.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestShouldSend(t *testing.T) {
	ns := &usecaseSender.NotificationSystem{
		ReminderInterval: 5 * time.Minute,
	}

	t.Run("no previous notification", func(t *testing.T) {
		if !ns.ShouldSend(nil) {
			t.Fatal("expected true")
		}
	})

	t.Run("notification recently sent", func(t *testing.T) {
		now := time.Now()

		if ns.ShouldSend(&now) {
			t.Fatal("expected false")
		}
	})

	t.Run("notification expired", func(t *testing.T) {
		old := time.Now().Add(-10 * time.Minute)

		if !ns.ShouldSend(&old) {
			t.Fatal("expected true")
		}
	})
}

func TestShouldSend_ReminderBoundary(t *testing.T) {
	ns := &usecaseSender.NotificationSystem{
		ReminderInterval: 5 * time.Minute,
	}

	lastSent := time.Now().Add(
		-5*time.Minute - time.Second,
	)

	if !ns.ShouldSend(&lastSent) {
		t.Fatal("expected true")
	}
}

func TestCountMessages_AllNeedSending(t *testing.T) {
	ns := &usecaseSender.NotificationSystem{
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: &fakeSentSetRepo{
					sent: map[int64]entityDB.SentSet{},
				},
			},
		},
		ReminderInterval: 5 * time.Minute,
	}

	result, err := ns.CountMessages(
		context.Background(),
		[]entitySender.SetData{
			{
				SetID: 1,
			},
		},
	)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result != 2 {
		t.Fatalf(
			"expected 2 messages, got %d",
			result,
		)
	}
}

func TestCountMessages_OneAlreadySent(t *testing.T) {
	now := time.Now()

	ns := &usecaseSender.NotificationSystem{
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: &fakeSentSetRepo{
					sent: map[int64]entityDB.SentSet{
						1: {
							SentAtP1: &now,
						},
					},
				},
			},
		},
		ReminderInterval: 5 * time.Minute,
	}

	result, err := ns.CountMessages(
		context.Background(),
		[]entitySender.SetData{
			{
				SetID: 1,
			},
		},
	)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result != 1 {
		t.Fatalf(
			"expected 1 message, got %d",
			result,
		)
	}
}

func TestCountMessages_NoMessagesNeeded(t *testing.T) {
	now := time.Now()

	ns := &usecaseSender.NotificationSystem{
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: &fakeSentSetRepo{
					sent: map[int64]entityDB.SentSet{
						1: {
							SentAtP1: &now,
							SentAtP2: &now,
						},
					},
				},
			},
		},
		ReminderInterval: 5 * time.Minute,
	}

	result, err := ns.CountMessages(
		context.Background(),
		[]entitySender.SetData{
			{
				SetID: 1,
			},
		},
	)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result != 0 {
		t.Fatalf(
			"expected 0 messages, got %d",
			result,
		)
	}
}

func TestCountMessages_ContextCanceled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	ns := &usecaseSender.NotificationSystem{}

	result, err := ns.CountMessages(
		ctx,
		[]entitySender.SetData{
			{
				SetID: 1,
			},
		},
	)

	if !errors.Is(err, context.Canceled) {
		t.Fatalf(
			"expected context canceled error, got %v",
			err,
		)
	}

	if result != 0 {
		t.Fatalf(
			"expected 0 messages, got %d",
			result,
		)
	}
}

func TestCountMessages_DBError(t *testing.T) {
	ns := &usecaseSender.NotificationSystem{
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: &fakeSentSetRepo{
					err: errors.New("database error"),
				},
			},
		},
	}

	result, err := ns.CountMessages(
		context.Background(),
		[]entitySender.SetData{
			{
				SetID: 1,
			},
		},
	)

	if err == nil {
		t.Fatal("expected error")
	}

	if result != 0 {
		t.Fatalf(
			"expected 0 messages, got %d",
			result,
		)
	}
}

func TestCountMessages_MultipleSets(t *testing.T) {
	now := time.Now()

	ns := &usecaseSender.NotificationSystem{
		Db: &dbManager.Database{
			SentSets: db.SentSet{
				Repo: &fakeSentSetRepo{
					sent: map[int64]entityDB.SentSet{
						// Set 2: first messages was sent
						2: {
							SentAtP1: &now,
						},

						// Set 3: two messages was sent
						3: {
							SentAtP1: &now,
							SentAtP2: &now,
						},
					},
				},
			},
		},
		ReminderInterval: 5 * time.Minute,
	}

	result, err := ns.CountMessages(
		context.Background(),
		[]entitySender.SetData{
			{
				SetID: 1, // 2 messages
			},
			{
				SetID: 2, // 1 message
			},
			{
				SetID: 3, // 0 messages
			},
		},
	)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expected := int64(3)

	if result != expected {
		t.Fatalf(
			"expected %d messages, got %d",
			expected,
			result,
		)
	}
}
