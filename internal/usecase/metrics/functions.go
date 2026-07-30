package metrics

import (
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
)

func (c *Collector) EstimateRemaining(remainingMessages int64) time.Duration {
	if remainingMessages <= 0 {
		return 0
	}

	return time.Duration(remainingMessages) * c.averageDuration(&c.totals.MessageDuration)
}

func (c *Collector) averageDuration(d *metrics.Duration) time.Duration {
	count := d.Count.Load()

	if count == 0 {
		return 0
	}

	return time.Duration(d.Total.Load() / count)
}

func (c *Collector) setLastError(err error) {
	c.state.Mu.Lock()
	c.state.LastError = err
	c.state.Mu.Unlock()
}

func successRate(success, attempts int64) float64 {
	if attempts == 0 {
		return 0
	}
	return float64(success) * 100 / float64(attempts)
}
