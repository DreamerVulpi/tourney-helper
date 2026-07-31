package rateLimiter

import (
	"context"
	"time"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/rateLimiter"
)

func (r *RateLimiter) Wait(ctx context.Context, operation entity.Operation) error {
	for {
		if err := r.Allow(operation); err == nil {
			return nil
		}

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
	snapshot := r.reader.Snapshot()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.resetReservations()

	limits := r.rules.Limits()

	switch operation.Type {

	case entity.OperationRequest:
		// Per second
		currentSecond := snapshot.Current.RequestAttemptsLastSecond + r.reservedRequestsSecond
		if limits.RequestPerSecond > 0 && currentSecond+operation.Cost > limits.RequestPerSecond {
			return entity.ErrRequestLimit
		}

		// Per minute
		currentMinute := snapshot.Current.RequestAttemptsLastMinute + r.reservedRequestsMinute
		if limits.RequestPerMinute > 0 && currentMinute+operation.Cost > limits.RequestPerMinute {
			return entity.ErrRequestLimit
		}

		r.reservedRequestsSecond += operation.Cost
		r.reservedRequestsMinute += operation.Cost
	case entity.OperationMessage:
		currentMinute := snapshot.Current.MessageAttemptsLastMinute + r.reservedMessagesMinute
		if limits.MessagesPerMinute > 0 && currentMinute+operation.Cost > limits.MessagesPerMinute {
			return entity.ErrMessageLimit
		}
		r.reservedMessagesMinute += operation.Cost
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

func (r *RateLimiter) Release(operation entity.Operation) {
	r.mu.Lock()
	defer r.mu.Unlock()

	switch operation.Type {
	case entity.OperationRequest:
		r.reservedRequestsSecond -= operation.Cost
		if r.reservedRequestsSecond < 0 {
			r.reservedRequestsSecond = 0
		}

		r.reservedMessagesMinute -= operation.Cost
		if r.reservedRequestsMinute < 0 {
			r.reservedRequestsMinute = 0
		}
	case entity.OperationMessage:
		r.reservedMessagesMinute -= operation.Cost
		if r.reservedMessagesMinute < 0 {
			r.reservedMessagesMinute = 0
		}
	}
}
