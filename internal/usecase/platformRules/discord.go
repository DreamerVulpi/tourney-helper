package platformRules

import (
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
)

type DiscordRules struct{}

func (DiscordRules) Limits() entity.Limits {
	return entity.Limits{
		RequestPerSecond:  50,
		MessagesPerMinute: 3000,
		ObjectsInRequest:  100,
	}
}
