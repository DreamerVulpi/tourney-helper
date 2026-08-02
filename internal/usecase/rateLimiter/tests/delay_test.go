package rateLimiter_test

import (
	"testing"
	"time"

	entityMetrics "github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	"github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
	entityRateLimiter "github.com/dreamervulpi/tourney-helper/internal/entity/rateLimiter"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter/tests/testutil"
)

func TestDelay_Request_NoDelay(t *testing.T) {
	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 10,
		},
		entityMetrics.Snapshot{},
	)

	delay := limiter.Delay(entityRateLimiter.Operation{
		Type: entityRateLimiter.OperationRequest,
		Cost: 1,
	})

	testutil.RequireEqual(t, time.Duration(0), delay)
}

func TestDelay_Request_ReturnsSecondWindow(t *testing.T) {
	expected := 700 * time.Millisecond

	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 5,
		},
		entityMetrics.Snapshot{
			Current: entityMetrics.CurrentView{
				RequestAttemptsLastSecond: 5,
				RequestWindowRemaining:    expected,
			},
		},
	)

	delay := limiter.Delay(entityRateLimiter.Operation{
		Type: entityRateLimiter.OperationRequest,
		Cost: 1,
	})

	testutil.RequireEqual(t, expected, delay)
}

func TestDelay_Message_NoDelay(t *testing.T) {
	limiter := newLimiter(
		platformRules.Limits{
			MessagesPerMinute: 100,
		},
		entityMetrics.Snapshot{},
	)

	delay := limiter.Delay(entityRateLimiter.Operation{
		Type: entityRateLimiter.OperationMessage,
		Cost: 1,
	})

	testutil.RequireEqual(t, time.Duration(0), delay)
}

func TestDelay_Message_ReturnsMinuteWindow(t *testing.T) {
	expected := 25 * time.Second

	limiter := newLimiter(
		platformRules.Limits{
			MessagesPerMinute: 10,
		},
		entityMetrics.Snapshot{
			Current: entityMetrics.CurrentView{
				MessageAttemptsLastMinute: 10,
				MessageWindowRemaining:    expected,
			},
		},
	)

	delay := limiter.Delay(entityRateLimiter.Operation{
		Type: entityRateLimiter.OperationMessage,
		Cost: 1,
	})

	testutil.RequireEqual(t, expected, delay)
}
