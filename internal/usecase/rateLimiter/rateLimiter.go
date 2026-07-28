package rateLimiter

import (
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
}

func (r *RateLimiter) Snapshot() metrics.Snapshot {
	return r.reader.Snapshot()
}
