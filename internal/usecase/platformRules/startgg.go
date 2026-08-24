package platformRules

import (
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
)

type StartggRules struct{}

func (StartggRules) Limits() entity.Limits {
	return entity.Limits{
		RequestPerMinute: 80,
		ObjectsInRequest: 1000,
	}
}
