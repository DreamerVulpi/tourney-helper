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

	ReservedRequestsSecond int64
	RequestSecondWindow    time.Time

	ReservedRequestsMinute int64
	RequestMinuteWindow    time.Time

	ReservedMessagesMinute int64
	MessageMinuteWindow    time.Time
}

func (r *RateLimiter) Snapshot() metrics.Snapshot {
	return r.reader.Snapshot()
}

func (r *RateLimiter) Limits() platformRules.Limits {
	return r.rules.Limits()
}

func (r *RateLimiter) resetReservations() {
	now := time.Now()

	if now.Sub(r.RequestSecondWindow) >= time.Second {
		r.ReservedRequestsSecond = 0
		r.RequestSecondWindow = now
	}

	if now.Sub(r.RequestMinuteWindow) >= time.Minute {
		r.ReservedRequestsMinute = 0
		r.RequestMinuteWindow = now
	}

	if now.Sub(r.MessageMinuteWindow) >= time.Minute {
		r.ReservedMessagesMinute = 0
		r.MessageMinuteWindow = now
	}
}
