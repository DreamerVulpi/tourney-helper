package metrics

import (
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
)

func (c *Collector) RecordAPIRequest(err error, duration time.Duration) {
	c.recordRequestAttempt()
	c.recordDuration(&c.totals.RequestDuration, duration)

	if err != nil {
		c.recordRequestError(err)
		return
	}

	c.recordRequestSuccess()
}

func (c *Collector) RecordMessageSend(err error, duration time.Duration) {
	c.recordMessageAttempt()
	c.recordDuration(&c.totals.MessageDuration, duration)

	if err != nil {
		c.recordMessageError(err)
		return
	}

	c.recordMessageSuccess()
}

func (c *Collector) recordDuration(d *metrics.Duration, duration time.Duration) {
	ns := duration.Nanoseconds()
	d.Total.Add(ns)
	d.Count.Add(1)

	// Min
	for {
		min := d.Min.Load()
		if min != 0 && ns >= min {
			break
		}
		if d.Min.CompareAndSwap(min, ns) {
			break
		}
	}

	// Max
	for {
		max := d.Max.Load()
		if ns <= max {
			break
		}
		if d.Max.CompareAndSwap(max, ns) {
			break
		}
	}
}

func (c *Collector) recordRequestAttempt() {
	c.resetSecondIfNeed()
	c.resetRequestMinuteIfNeed()

	c.totals.RequestsAttempts.Add(1)
	c.current.RequestAttemptsLastSecond.Add(1)
	c.current.RequestAttemptsLastMinute.Add(1)

	c.state.Mu.Lock()
	c.state.LastRequest = time.Now()
	c.state.Mu.Unlock()
}

func (c *Collector) resetRequestMinuteIfNeed() {
	c.current.Mu.Lock()
	defer c.current.Mu.Unlock()

	if time.Since(c.current.RequestMinuteWindowStarted) >= time.Minute {
		c.current.RequestAttemptsLastMinute.Store(0)
		c.current.RequestMinuteWindowStarted = time.Now()
	}
}

func (c *Collector) resetMessageMinuteIfNeeded() {
	c.current.Mu.Lock()
	defer c.current.Mu.Unlock()

	if time.Since(c.current.MessageMinuteWindowStarted) >= time.Minute {
		c.current.MessageAttemptsLastMinute.Store(0)
		c.current.MessageSuccessLastMinute.Store(0)

		c.current.MessageMinuteWindowStarted = time.Now()
	}
}

func (c *Collector) resetSecondIfNeed() {
	c.current.Mu.Lock()
	defer c.current.Mu.Unlock()

	if time.Since(c.current.RequestSecondWindowStarted) >= time.Second {
		c.current.RequestAttemptsLastSecond.Store(0)

		c.current.RequestSecondWindowStarted = time.Now()
	}
}

func (c *Collector) recordMessageAttempt() {
	c.resetMessageMinuteIfNeeded()

	c.totals.MessagesAttempts.Add(1)
	c.current.MessageAttemptsLastMinute.Add(1)
}

func (c *Collector) recordMessageSuccess() {
	c.totals.MessagesSuccess.Add(1)
	c.current.MessageSuccessLastMinute.Add(1)

	c.state.Mu.Lock()
	c.state.LastMessage = time.Now()
	c.state.Mu.Unlock()
}

func (c *Collector) recordRequestSuccess() {
	c.totals.RequestSuccess.Add(1)
}

func (c *Collector) recordRequestError(err error) {
	c.totals.RequestErrors.Add(1)
	c.setLastError(err)
}

func (c *Collector) recordMessageError(err error) {
	c.totals.MessagesErrors.Add(1)
	c.setLastError(err)
}
