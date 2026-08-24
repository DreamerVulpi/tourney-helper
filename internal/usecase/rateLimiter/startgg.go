package rateLimiter

import "github.com/dreamervulpi/tourney-helper/internal/usecase/platformRules"

func NewStartggLimiter(reader MetricsReader) *RateLimiter {
	return &RateLimiter{
		rules:  platformRules.StartggRules{},
		reader: reader,
	}
}
