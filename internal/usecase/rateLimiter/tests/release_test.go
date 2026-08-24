package rateLimiter_test

import (
	"testing"

	entityRateLimiter "github.com/dreamervulpi/tourney-helper/internal/entity/rateLimiter"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/rateLimiter"
)

func TestRelease(t *testing.T) {
	tests := []struct {
		name string

		operation entityRateLimiter.Operation

		reservedRequestsSecond int64
		reservedRequestsMinute int64
		reservedMessagesMinute int64

		wantRequestsSecond int64
		wantRequestsMinute int64
		wantMessagesMinute int64
	}{
		{
			name: "releases request reservations",

			operation: entityRateLimiter.Operation{
				Type: entityRateLimiter.OperationRequest,
				Cost: 3,
			},

			reservedRequestsSecond: 10,
			reservedRequestsMinute: 20,

			wantRequestsSecond: 7,
			wantRequestsMinute: 17,
		},
		{
			name: "releases message reservations",

			operation: entityRateLimiter.Operation{
				Type: entityRateLimiter.OperationMessage,
				Cost: 5,
			},

			reservedMessagesMinute: 10,

			wantMessagesMinute: 5,
		},
		{
			name: "does not allow negative request reservations",

			operation: entityRateLimiter.Operation{
				Type: entityRateLimiter.OperationRequest,
				Cost: 10,
			},

			reservedRequestsSecond: 3,
			reservedRequestsMinute: 4,

			wantRequestsSecond: 0,
			wantRequestsMinute: 0,
		},
		{
			name: "does not allow negative message reservations",

			operation: entityRateLimiter.Operation{
				Type: entityRateLimiter.OperationMessage,
				Cost: 10,
			},

			reservedMessagesMinute: 3,

			wantMessagesMinute: 0,
		},
		{
			name: "ignores unknown operation",

			operation: entityRateLimiter.Operation{
				Type: entityRateLimiter.OperationType(999),
				Cost: 10,
			},

			reservedRequestsSecond: 5,
			reservedRequestsMinute: 5,
			reservedMessagesMinute: 5,

			wantRequestsSecond: 5,
			wantRequestsMinute: 5,
			wantMessagesMinute: 5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &rateLimiter.RateLimiter{
				ReservedRequestsSecond: tt.reservedRequestsSecond,
				ReservedRequestsMinute: tt.reservedRequestsMinute,
				ReservedMessagesMinute: tt.reservedMessagesMinute,
			}

			r.Release(tt.operation)

			if r.ReservedRequestsSecond != tt.wantRequestsSecond {
				t.Fatalf(
					"reservedRequestsSecond = %d, want %d",
					r.ReservedRequestsSecond,
					tt.wantRequestsSecond,
				)
			}

			if r.ReservedRequestsMinute != tt.wantRequestsMinute {
				t.Fatalf(
					"reservedRequestsMinute = %d, want %d",
					r.ReservedRequestsMinute,
					tt.wantRequestsMinute,
				)
			}

			if r.ReservedMessagesMinute != tt.wantMessagesMinute {
				t.Fatalf(
					"reservedMessagesMinute = %d, want %d",
					tt.reservedMessagesMinute,
					tt.wantMessagesMinute,
				)
			}
		})
	}
}
