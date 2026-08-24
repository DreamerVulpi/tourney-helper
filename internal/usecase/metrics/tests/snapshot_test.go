package metrics_test

import (
	"errors"
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

func TestCollector_Snapshot_Empty(t *testing.T) {
	c := metrics.NewCollector()

	s := c.Snapshot()

	if s.Totals.RequestsAttempts != 0 {
		t.Fatalf("expected 0, got %d", s.Totals.RequestsAttempts)
	}

	if s.Totals.MessagesAttempts != 0 {
		t.Fatalf("expected 0, got %d", s.Totals.MessagesAttempts)
	}

	if s.State.LastError != "" {
		t.Fatalf("expected empty error, got %q", s.State.LastError)
	}

	if !s.State.LastRequest.IsZero() {
		t.Fatal("LastRequest should be zero")
	}

	if !s.State.LastMessage.IsZero() {
		t.Fatal("LastMessage should be zero")
	}
}

func TestCollector_Snapshot_Request(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordAPIRequest(nil, 150*time.Millisecond)

	s := c.Snapshot()

	if s.Totals.RequestsAttempts != 1 {
		t.Fatalf("expected 1, got %d", s.Totals.RequestsAttempts)
	}

	if s.Totals.RequestSuccess != 1 {
		t.Fatalf("expected 1, got %d", s.Totals.RequestSuccess)
	}

	if s.Totals.RequestErrors != 0 {
		t.Fatalf("expected 0, got %d", s.Totals.RequestErrors)
	}

	if s.Current.RequestAttemptsLastSecond != 1 {
		t.Fatalf("expected 1, got %d", s.Current.RequestAttemptsLastSecond)
	}

	if s.Current.RequestAttemptsLastMinute != 1 {
		t.Fatalf("expected 1, got %d", s.Current.RequestAttemptsLastMinute)
	}

	if s.State.LastRequest.IsZero() {
		t.Fatal("LastRequest should be set")
	}
}

func TestCollector_Snapshot_Message(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordMessageSend(nil, 20*time.Millisecond)

	s := c.Snapshot()

	if s.Totals.MessagesAttempts != 1 {
		t.Fatalf("expected 1, got %d", s.Totals.MessagesAttempts)
	}

	if s.Totals.MessagesSuccess != 1 {
		t.Fatalf("expected 1, got %d", s.Totals.MessagesSuccess)
	}

	if s.Totals.MessagesErrors != 0 {
		t.Fatalf("expected 0, got %d", s.Totals.MessagesErrors)
	}

	if s.Current.MessageAttemptsLastMinute != 1 {
		t.Fatalf("expected 1, got %d", s.Current.MessageAttemptsLastMinute)
	}

	if s.Current.MessageSuccessLastMinute != 1 {
		t.Fatalf("expected 1, got %d", s.Current.MessageSuccessLastMinute)
	}

	if s.State.LastMessage.IsZero() {
		t.Fatal("LastMessage should be set")
	}
}

func TestCollector_Snapshot_Error(t *testing.T) {
	c := metrics.NewCollector()

	expected := errors.New("network error")

	c.RecordAPIRequest(expected, time.Millisecond)

	s := c.Snapshot()

	if s.Totals.RequestErrors != 1 {
		t.Fatalf("expected 1, got %d", s.Totals.RequestErrors)
	}

	if s.State.LastError != expected.Error() {
		t.Fatalf("expected %q, got %q", expected.Error(), s.State.LastError)
	}
}

func TestCollector_Snapshot_WindowRemaining(t *testing.T) {
	c := metrics.NewCollector()

	s := c.Snapshot()

	if s.Current.RequestWindowRemaining <= 0 {
		t.Fatal("request window should be positive")
	}

	if s.Current.RequestWindowRemaining > time.Second {
		t.Fatal("request window exceeds one second")
	}

	if s.Current.MessageWindowRemaining <= 0 {
		t.Fatal("message window should be positive")
	}

	if s.Current.MessageWindowRemaining > time.Minute {
		t.Fatal("message window exceeds one minute")
	}
}
