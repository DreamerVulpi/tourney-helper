package rateLimiter

import "github.com/dreamervulpi/tourney-helper/internal/usecase/platformRules"

func NewDiscordLimiter(reader MetricsReader) *RateLimiter {
	return &RateLimiter{
		rules:  platformRules.DiscordRules{},
		reader: reader,
	}
}
