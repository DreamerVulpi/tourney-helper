package platformRules

type Limits struct {
	RequestPerSecond  int64
	RequestPerMinute  int64
	MessagesPerMinute int64
	ObjectsInRequest  int64
}

type SafeLimits struct {
	RequestPerSecond  int64
	RequestPerMinute  int64
	MessagesPerMinute int64
	ObjectsInRequest  int64
}

type Capabilities struct {
	SupportsDMs         bool
	SupportBulkRequests bool
	SupportsEditing     bool
}

type PlatformRules interface {
	Limits() Limits
}
