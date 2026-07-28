package metrics

import (
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
)

func (c *Collector) EstimateRemaining(total int64) time.Duration {
	sent := c.totals.MessagesSuccess.Load()
	left := total - sent
	if left <= 0 {
		return 0
	}

	return time.Duration(left) * c.averageDuration(&c.totals.MessageDuration)
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
