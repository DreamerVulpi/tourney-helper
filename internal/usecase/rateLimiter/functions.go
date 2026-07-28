package rateLimiter

import (
	"context"
	"time"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/rateLimiter"
)

func (r *RateLimiter) Wait(ctx context.Context, operation entity.Operation) error {
	for {
		delay := r.Delay(operation)
		if delay <= 0 {
			return nil
		}

		timer := time.NewTimer(delay)

		select {
		case <-ctx.Done():
			timer.Stop()
			return ctx.Err()
		case <-timer.C:
		}
	}
}

func (r *RateLimiter) Allow(operation entity.Operation) error {
	limits := r.rules.Limits()
	snapshot := r.reader.Snapshot()

	switch operation.Type {
	case entity.OperationRequest:
		if snapshot.Current.RequestAttemptsLastSecond+operation.Cost > limits.RequestPerSecond {
			return entity.ErrRequestLimit
		}
	case entity.OperationMessage:
		if snapshot.Current.MessageAttemptsLastMinute+operation.Cost > limits.MessagesPerMinute {
			return entity.ErrMessageLimit
		}
	default:
		return entity.ErrUnknownOperation
	}

	return nil
}

func (r *RateLimiter) Delay(operation entity.Operation) time.Duration {
	limits := r.rules.Limits()
	snapshot := r.reader.Snapshot()

	switch operation.Type {
	case entity.OperationRequest:
		if snapshot.Current.RequestAttemptsLastSecond+operation.Cost <= limits.RequestPerSecond {
			return 0
		}
		return snapshot.Current.RequestWindowRemaining
	case entity.OperationMessage:
		if snapshot.Current.MessageAttemptsLastMinute+operation.Cost <= limits.MessagesPerMinute {
			return 0
		}
		return snapshot.Current.MessageWindowRemaining
	}
	return 0
}
