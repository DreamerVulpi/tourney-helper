package platformRules

type Limits struct {
	RequestPerSecond  int64
	RequestPerMinute  int64
	MessagesPerMinute int64
	ObjectsInRequest  int64
}

type PlatformRules interface {
	Limits() Limits
}
