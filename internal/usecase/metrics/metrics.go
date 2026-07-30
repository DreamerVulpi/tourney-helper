package metrics

import (
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
)

type Collector struct {
	totals  metrics.Totals
	current metrics.Current
	state   metrics.State
}

func NewCollector() *Collector {
	now := time.Now()
	return &Collector{
		current: metrics.Current{
			RequestSecondWindowStarted: now,
			RequestMinuteWindowStarted: now,
			MessageMinuteWindowStarted: now,
		},
	}
}

func (c *Collector) Snapshot() metrics.Snapshot {
	c.resetRequestMinuteIfNeed()
	c.resetSecondIfNeed()
	c.resetMessageMinuteIfNeeded()

	c.state.Mu.RLock()
	defer c.state.Mu.RUnlock()

	var lastError string
	if c.state.LastError != nil {
		lastError = c.state.LastError.Error()
	}

	requestRemaining := time.Second - time.Since(c.current.RequestSecondWindowStarted)
	if requestRemaining < 0 {
		requestRemaining = 0
	}

	messageRemaining := time.Minute - time.Since(c.current.MessageMinuteWindowStarted)
	if messageRemaining < 0 {
		messageRemaining = 0
	}

	return metrics.Snapshot{
		Totals: metrics.TotalsView{
			RequestsAttempts: c.totals.RequestsAttempts.Load(),
			RequestSuccess:   c.totals.RequestSuccess.Load(),
			RequestErrors:    c.totals.RequestErrors.Load(),

			MessagesAttempts: c.totals.MessagesAttempts.Load(),
			MessagesSuccess:  c.totals.MessagesSuccess.Load(),
			MessagesErrors:   c.totals.MessagesErrors.Load(),

			RequestDuration: metrics.DurationView{
				AverageMs: c.averageDuration(&c.totals.RequestDuration).Milliseconds(),
				MinMs:     time.Duration(c.totals.RequestDuration.Min.Load()).Milliseconds(),
				MaxMs:     time.Duration(c.totals.RequestDuration.Max.Load()).Milliseconds(),
			},

			MessageDuration: metrics.DurationView{
				AverageMs: c.averageDuration(&c.totals.MessageDuration).Milliseconds(),
				MinMs:     time.Duration(c.totals.MessageDuration.Min.Load()).Milliseconds(),
				MaxMs:     time.Duration(c.totals.MessageDuration.Max.Load()).Milliseconds(),
			},

			RequestSuccessRate: successRate(
				c.totals.RequestSuccess.Load(),
				c.totals.RequestsAttempts.Load(),
			),

			MessageSuccessRate: successRate(
				c.totals.MessagesSuccess.Load(),
				c.totals.MessagesAttempts.Load(),
			),
		},

		Current: metrics.CurrentView{
			RequestAttemptsLastSecond: c.current.RequestAttemptsLastSecond.Load(),
			RequestAttemptsLastMinute: c.current.RequestAttemptsLastMinute.Load(),
			MessageAttemptsLastMinute: c.current.MessageAttemptsLastMinute.Load(),
			MessageSuccessLastMinute:  c.current.MessageSuccessLastMinute.Load(),
			RequestWindowRemaining:    requestRemaining,
			MessageWindowRemaining:    messageRemaining,
		},

		State: metrics.StateView{
			LastRequest: c.state.LastRequest,
			LastMessage: c.state.LastMessage,
			LastError:   lastError,
		},
	}
}
