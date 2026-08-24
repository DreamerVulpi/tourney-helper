package metrics_test

import (
	"errors"
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

func TestRecordAPIRequestSuccess(t *testing.T) {
	collector := metrics.NewCollector()

	collector.RecordAPIRequest(nil, 150*time.Millisecond)

	snapshot := collector.Snapshot()

	if snapshot.Totals.RequestsAttempts != 1 {
		t.Fatalf("expected 1 request attempt, got %d", snapshot.Totals.RequestsAttempts)
	}

	if snapshot.Totals.RequestSuccess != 1 {
		t.Fatalf("expected 1 successful request, got %d", snapshot.Totals.RequestSuccess)
	}

	if snapshot.Totals.RequestErrors != 0 {
		t.Fatalf("expected 0 request errors, got %d", snapshot.Totals.RequestErrors)
	}

	if snapshot.State.LastRequest.IsZero() {
		t.Fatal("LastRequest was not updated")
	}

	if snapshot.State.LastError != "" {
		t.Fatalf("unexpected last error: %q", snapshot.State.LastError)
	}
}

func TestRecordAPIRequestError(t *testing.T) {
	collector := metrics.NewCollector()

	expected := errors.New("api error")

	collector.RecordAPIRequest(expected, 200*time.Millisecond)

	snapshot := collector.Snapshot()

	if snapshot.Totals.RequestsAttempts != 1 {
		t.Fatalf("expected 1 request attempt, got %d", snapshot.Totals.RequestsAttempts)
	}

	if snapshot.Totals.RequestSuccess != 0 {
		t.Fatalf("expected 0 successful requests, got %d", snapshot.Totals.RequestSuccess)
	}

	if snapshot.Totals.RequestErrors != 1 {
		t.Fatalf("expected 1 request error, got %d", snapshot.Totals.RequestErrors)
	}

	if snapshot.State.LastError != expected.Error() {
		t.Fatalf("expected %q, got %q", expected.Error(), snapshot.State.LastError)
	}
}

func TestRecordMessageSendSuccess(t *testing.T) {
	collector := metrics.NewCollector()

	collector.RecordMessageSend(nil, 300*time.Millisecond)

	snapshot := collector.Snapshot()

	if snapshot.Totals.MessagesAttempts != 1 {
		t.Fatalf("expected 1 message attempt, got %d", snapshot.Totals.MessagesAttempts)
	}

	if snapshot.Totals.MessagesSuccess != 1 {
		t.Fatalf("expected 1 successful message, got %d", snapshot.Totals.MessagesSuccess)
	}

	if snapshot.Totals.MessagesErrors != 0 {
		t.Fatalf("expected 0 message errors, got %d", snapshot.Totals.MessagesErrors)
	}

	if snapshot.State.LastMessage.IsZero() {
		t.Fatal("LastMessage was not updated")
	}

	if snapshot.State.LastError != "" {
		t.Fatalf("unexpected last error: %q", snapshot.State.LastError)
	}
}

func TestRecordMessageSendError(t *testing.T) {
	collector := metrics.NewCollector()

	expected := errors.New("send error")

	collector.RecordMessageSend(expected, 500*time.Millisecond)

	snapshot := collector.Snapshot()

	if snapshot.Totals.MessagesAttempts != 1 {
		t.Fatalf("expected 1 message attempt, got %d", snapshot.Totals.MessagesAttempts)
	}

	if snapshot.Totals.MessagesSuccess != 0 {
		t.Fatalf("expected 0 successful messages, got %d", snapshot.Totals.MessagesSuccess)
	}

	if snapshot.Totals.MessagesErrors != 1 {
		t.Fatalf("expected 1 message error, got %d", snapshot.Totals.MessagesErrors)
	}

	if snapshot.State.LastError != expected.Error() {
		t.Fatalf("expected %q, got %q", expected.Error(), snapshot.State.LastError)
	}
}

func TestRecordAPIRequestAndMessageTogether(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordAPIRequest(nil, 100*time.Millisecond)
	c.RecordAPIRequest(nil, 200*time.Millisecond)

	c.RecordMessageSend(nil, 50*time.Millisecond)
	c.RecordMessageSend(nil, 75*time.Millisecond)

	s := c.Snapshot()

	// API
	if s.Totals.RequestsAttempts != 2 {
		t.Fatalf("expected 2 request attempts, got %d", s.Totals.RequestsAttempts)
	}

	if s.Totals.RequestSuccess != 2 {
		t.Fatalf("expected 2 request success, got %d", s.Totals.RequestSuccess)
	}

	if s.Totals.RequestErrors != 0 {
		t.Fatalf("expected 0 request errors, got %d", s.Totals.RequestErrors)
	}

	// Messages
	if s.Totals.MessagesAttempts != 2 {
		t.Fatalf("expected 2 message attempts, got %d", s.Totals.MessagesAttempts)
	}

	if s.Totals.MessagesSuccess != 2 {
		t.Fatalf("expected 2 message success, got %d", s.Totals.MessagesSuccess)
	}

	if s.Totals.MessagesErrors != 0 {
		t.Fatalf("expected 0 message errors, got %d", s.Totals.MessagesErrors)
	}

	// Current windows
	if s.Current.RequestAttemptsLastSecond != 2 {
		t.Fatalf("expected 2 requests/sec, got %d", s.Current.RequestAttemptsLastSecond)
	}

	if s.Current.RequestAttemptsLastMinute != 2 {
		t.Fatalf("expected 2 requests/min, got %d", s.Current.RequestAttemptsLastMinute)
	}

	if s.Current.MessageAttemptsLastMinute != 2 {
		t.Fatalf("expected 2 messages/min, got %d", s.Current.MessageAttemptsLastMinute)
	}

	if s.Current.MessageSuccessLastMinute != 2 {
		t.Fatalf("expected 2 successful messages/min, got %d", s.Current.MessageSuccessLastMinute)
	}
}
