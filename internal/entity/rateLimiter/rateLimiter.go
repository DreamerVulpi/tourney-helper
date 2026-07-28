package rateLimiter

import (
	"context"
	"errors"

	"github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
)

var (
	ErrRequestLimit     = errors.New("request limit has been reached")
	ErrMessageLimit     = errors.New("message limit has been reached")
	ErrUnknownOperation = errors.New("unkown operation")
)

type Priority int
type OperationType int

type Operation struct {
	Type     OperationType
	Priority Priority
	Cost     int64
}

const (
	OperationRequest OperationType = iota
	OperationMessage
)

const (
	PriorityHigh Priority = iota
	PriorityNormal
	PriorityLow
)

type RateLimiter interface {
	Wait(ctx context.Context, operation Operation) error
	Snapshot() metrics.Snapshot
}
