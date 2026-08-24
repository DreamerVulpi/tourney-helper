package rateLimiter

func New(
	rules RulesReader,
	reader MetricsReader,
) *RateLimiter {
	return &RateLimiter{
		rules:  rules,
		reader: reader,
	}
}
