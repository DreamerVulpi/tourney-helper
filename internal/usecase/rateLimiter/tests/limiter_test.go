package rateLimiter_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	"github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
	entityRateLimiter "github.com/dreamervulpi/tourney-helper/internal/entity/rateLimiter"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter/tests/testutil"
)

type fakeRules struct {
	limits platformRules.Limits
}

func (f fakeRules) Limits() platformRules.Limits {
	return f.limits
}

type fakeMetrics struct {
	snapshots []metrics.Snapshot
	index     int
}

func (f *fakeMetrics) Snapshot() metrics.Snapshot {
	if f.index >= len(f.snapshots)-1 {
		return f.snapshots[len(f.snapshots)-1]
	}

	s := f.snapshots[f.index]
	f.index++

	return s
}

func newLimiter(
	limits platformRules.Limits,
	snapshots ...metrics.Snapshot,
) *rateLimiter.RateLimiter {
	if len(snapshots) == 0 {
		snapshots = []metrics.Snapshot{{}}
	}

	return rateLimiter.New(
		fakeRules{limits: limits},
		&fakeMetrics{
			snapshots: snapshots,
		},
	)
}

func TestAllow_Request_Success(t *testing.T) {
	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 10,
			RequestPerMinute: 100,
		},
		metrics.Snapshot{},
	)

	err := limiter.Allow(entityRateLimiter.Operation{
		Type: entityRateLimiter.OperationRequest,
		Cost: 1,
	})

	testutil.RequireNoError(t, err)
}

func TestAllow_Request_PerSecondLimit(t *testing.T) {
	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 5,
			RequestPerMinute: 100,
		},
		metrics.Snapshot{
			Current: metrics.CurrentView{
				RequestAttemptsLastSecond: 5,
			},
		},
	)

	err := limiter.Allow(entityRateLimiter.Operation{
		Type: entityRateLimiter.OperationRequest,
		Cost: 1,
	})

	testutil.RequireEqual(t, entityRateLimiter.ErrRequestLimit, err)
}
