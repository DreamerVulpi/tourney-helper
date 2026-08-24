package metrics_test

import (
	"errors"
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

func TestCollector_EstimateRemaining_Empty(t *testing.T) {
	c := metrics.NewCollector()

	eta := c.EstimateRemaining(10)

	if eta != 0 {
		t.Fatalf("expected 0, got %v", eta)
	}
}

func TestCollector_EstimateRemaining_ZeroMessages(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordMessageSend(nil, 100*time.Millisecond)

	eta := c.EstimateRemaining(0)

	if eta != 0 {
		t.Fatalf("expected 0, got %v", eta)
	}
}

func TestCollector_EstimateRemaining(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordMessageSend(nil, 100*time.Millisecond)
	c.RecordMessageSend(nil, 200*time.Millisecond)
	c.RecordMessageSend(nil, 300*time.Millisecond)

	eta := c.EstimateRemaining(5)

	expected := time.Second

	if eta != expected {
		t.Fatalf("expected %v, got %v", expected, eta)
	}
}

func TestCollector_EstimateRemaining_OneMessage(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordMessageSend(nil, 250*time.Millisecond)

	eta := c.EstimateRemaining(1)

	if eta != 250*time.Millisecond {
		t.Fatalf("expected 250ms, got %v", eta)
	}
}

func TestCollector_EstimateRemaining_WithErrors(t *testing.T) {
	c := metrics.NewCollector()

	c.RecordMessageSend(nil, 100*time.Millisecond)
	err := errors.New("send failed")
	c.RecordMessageSend(err, 300*time.Millisecond)

	eta := c.EstimateRemaining(2)

	expected := 400 * time.Millisecond

	if eta != expected {
		t.Fatalf("expected %v, got %v", expected, eta)
	}
}
