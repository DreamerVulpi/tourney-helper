package metrics

import (
	"sync"
	"sync/atomic"
	"time"
)

type Totals struct {
	RequestsAttempts atomic.Int64
	RequestSuccess   atomic.Int64
	RequestErrors    atomic.Int64

	MessagesAttempts atomic.Int64
	MessagesSuccess  atomic.Int64
	MessagesErrors   atomic.Int64

	RequestDuration Duration
	MessageDuration Duration
}

type Duration struct {
	Total atomic.Int64
	Count atomic.Int64
	Min   atomic.Int64
	Max   atomic.Int64
}

type Current struct {
	RequestAttemptsLastSecond atomic.Int64
	RequestAttemptsLastMinute atomic.Int64

	MessageAttemptsLastMinute atomic.Int64
	MessageSuccessLastMinute  atomic.Int64

	RequestSecondWindowStarted time.Time
	RequestMinuteWindowStarted time.Time
	MessageMinuteWindowStarted time.Time

	Mu sync.Mutex
}

type State struct {
	Mu          sync.RWMutex
	LastRequest time.Time
	LastMessage time.Time

	LastError error
}

type Snapshot struct {
	Totals            TotalsView
	Current           CurrentView
	State             StateView
	EstimateRemaining int64
}

type TotalsView struct {
	RequestsAttempts int64
	RequestSuccess   int64
	RequestErrors    int64

	MessagesAttempts int64
	MessagesSuccess  int64
	MessagesErrors   int64

	RequestDuration DurationView
	MessageDuration DurationView
}

type CurrentView struct {
	RequestAttemptsLastSecond int64
	RequestAttemptsLastMinute int64

	MessageAttemptsLastMinute int64
	MessageSuccessLastMinute  int64

	RequestWindowRemaining time.Duration
	MessageWindowRemaining time.Duration
}

type StateView struct {
	LastRequest time.Time
	LastMessage time.Time
	LastError   string
}

type DurationView struct {
	AverageMs int64
	MinMs     int64
	MaxMs     int64
}
