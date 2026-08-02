package rateLimiter_test

import (
	"testing"

	"context"

	"time"

	entityMetrics "github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	"github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
	entityRateLimiter "github.com/dreamervulpi/tourney-helper/internal/entity/rateLimiter"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter/tests/testutil"
)

func TestWait_SuccessImmediately(t *testing.T) {
	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 10,
			RequestPerMinute: 100,
		},
	)

	err := limiter.Wait(
		context.Background(),
		entityRateLimiter.Operation{
			Type: entityRateLimiter.OperationRequest,
			Cost: 1,
		},
	)

	testutil.RequireNoError(t, err)
}

func TestWait_ContextCanceled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 1,
		},
		entityMetrics.Snapshot{
			Current: entityMetrics.CurrentView{
				RequestAttemptsLastSecond: 1,
				RequestWindowRemaining:    100 * time.Millisecond,
			},
		},
	)

	err := limiter.Wait(
		ctx,
		entityRateLimiter.Operation{
			Type: entityRateLimiter.OperationRequest,
			Cost: 1,
		},
	)

	testutil.RequireEqual(t, context.Canceled, err)
}

func TestWait_WaitsAndSucceeds(t *testing.T) {
	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 1,
		},
		entityMetrics.Snapshot{
			Current: entityMetrics.CurrentView{
				RequestAttemptsLastSecond: 1,
				RequestWindowRemaining:    time.Millisecond,
			},
		},
		entityMetrics.Snapshot{
			Current: entityMetrics.CurrentView{
				RequestAttemptsLastSecond: 0,
			},
		},
	)

	err := limiter.Wait(
		context.Background(),
		entityRateLimiter.Operation{
			Type: entityRateLimiter.OperationRequest,
			Cost: 1,
		},
	)

	testutil.RequireNoError(t, err)
}

func TestWait_AfterDelaySucceeds(t *testing.T) {
	limiter := newLimiter(
		platformRules.Limits{
			RequestPerSecond: 1,
		},
		[]entityMetrics.Snapshot{
			// Allow() -> запрещаем
			{
				Current: entityMetrics.CurrentView{
					RequestAttemptsLastSecond: 1,
				},
			},

			// Delay() -> говорим ждать
			{
				Current: entityMetrics.CurrentView{
					RequestAttemptsLastSecond: 2,
					RequestWindowRemaining:    10 * time.Millisecond,
				},
			},

			// Allow() после ожидания -> разрешаем
			{
				Current: entityMetrics.CurrentView{
					RequestAttemptsLastSecond: 0,
				},
			},
		}...,
	)

	start := time.Now()

	err := limiter.Wait(
		context.Background(),
		entityRateLimiter.Operation{
			Type: entityRateLimiter.OperationRequest,
			Cost: 1,
		},
	)

	elapsed := time.Since(start)

	testutil.RequireNoError(t, err)

	if elapsed < 10*time.Millisecond {
		t.Fatalf("expected Wait() to sleep at least 10ms, got %v", elapsed)
	}
}
