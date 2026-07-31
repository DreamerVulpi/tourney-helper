package rateLimiter

import (
	"sync"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	"github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
)

type RulesReader interface {
	Limits() platformRules.Limits
}

type MetricsReader interface {
	Snapshot() metrics.Snapshot
}

type RateLimiter struct {
	rules  RulesReader
	reader MetricsReader
	mu     sync.Mutex

	reservedRequestsSecond int64
	requestSecondWindow    time.Time

	reservedRequestsMinute int64
	requestMinuteWindow    time.Time

	reservedMessagesMinute int64
	messageMinuteWindow    time.Time
}

func (r *RateLimiter) Snapshot() metrics.Snapshot {
	return r.reader.Snapshot()
}

func (r *RateLimiter) Limits() platformRules.Limits {
	return r.rules.Limits()
}

func (r *RateLimiter) resetReservations() {
	now := time.Now()

	if now.Sub(r.requestSecondWindow) >= time.Second {
		r.reservedRequestsSecond = 0
		r.requestSecondWindow = now
	}

	if now.Sub(r.requestMinuteWindow) >= time.Minute {
		r.reservedRequestsMinute = 0
		r.requestMinuteWindow = now
	}

	if now.Sub(r.messageMinuteWindow) >= time.Minute {
		r.reservedMessagesMinute = 0
		r.messageMinuteWindow = now
	}
}
