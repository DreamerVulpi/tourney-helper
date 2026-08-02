package metrics_test

import (
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

func TestCollector_RequestDuration(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordAPIRequest(nil, 100*time.Millisecond)
	c.RecordAPIRequest(nil, 300*time.Millisecond)
	c.RecordAPIRequest(nil, 200*time.Millisecond)

	s := c.Snapshot()

	if s.Totals.RequestDuration.MinMs != 100 {
		t.Fatalf("expected min 100ms, got %d", s.Totals.RequestDuration.MinMs)
	}

	if s.Totals.RequestDuration.MaxMs != 300 {
		t.Fatalf("expected max 300ms, got %d", s.Totals.RequestDuration.MaxMs)
	}

	if s.Totals.RequestDuration.AverageMs != 200 {
		t.Fatalf("expected average 200ms, got %d", s.Totals.RequestDuration.AverageMs)
	}
}

func TestCollector_RequestDuration_SingleValue(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordAPIRequest(nil, 250*time.Millisecond)

	s := c.Snapshot()

	if s.Totals.RequestDuration.MinMs != 250 {
		t.Fatalf("expected min 250ms, got %d", s.Totals.RequestDuration.MinMs)
	}

	if s.Totals.RequestDuration.MaxMs != 250 {
		t.Fatalf("expected max 250ms, got %d", s.Totals.RequestDuration.MaxMs)
	}

	if s.Totals.RequestDuration.AverageMs != 250 {
		t.Fatalf("expected average 250ms, got %d", s.Totals.RequestDuration.AverageMs)
	}
}

func TestCollector_MessageDuration(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordMessageSend(nil, 10*time.Millisecond)
	c.RecordMessageSend(nil, 20*time.Millisecond)
	c.RecordMessageSend(nil, 30*time.Millisecond)

	s := c.Snapshot()

	if s.Totals.MessageDuration.MinMs != 10 {
		t.Fatalf("expected min 10ms, got %d", s.Totals.MessageDuration.MinMs)
	}

	if s.Totals.MessageDuration.MaxMs != 30 {
		t.Fatalf("expected max 30ms, got %d", s.Totals.MessageDuration.MaxMs)
	}

	if s.Totals.MessageDuration.AverageMs != 20 {
		t.Fatalf("expected average 20ms, got %d", s.Totals.MessageDuration.AverageMs)
	}
}

func TestCollector_ZeroDuration(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordAPIRequest(nil, 0)

	s := c.Snapshot()

	if s.Totals.RequestDuration.MinMs != 0 {
		t.Fatalf("expected min 0, got %d", s.Totals.RequestDuration.MinMs)
	}

	if s.Totals.RequestDuration.MaxMs != 0 {
		t.Fatalf("expected max 0, got %d", s.Totals.RequestDuration.MaxMs)
	}

	if s.Totals.RequestDuration.AverageMs != 0 {
		t.Fatalf("expected average 0, got %d", s.Totals.RequestDuration.AverageMs)
	}
}
