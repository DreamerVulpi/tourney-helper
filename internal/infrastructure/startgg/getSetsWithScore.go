package startgg

import (
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func (c *Client) GetSetsWithScore(phaseGroupID int64, page int, perPage int) ([]startgg.Nodes, error) {
	var variables = map[string]any{
		"phaseGroupId": phaseGroupID,
		"page":         page,
		"perPage":      perPage,
		"states":       []int{1, 2, 3},
	}

	results, err := GetData[startgg.RawPhaseGroupSetsData](c, startgg.GetSetsWithScore, variables)
	if err != nil {
		return nil, err
	}

	return results.Data.PhaseGroup.Sets.Nodes, nil
}
