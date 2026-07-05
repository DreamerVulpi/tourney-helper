package startgg

import (
	"github.com/dreamervulpi/tourneyBot/internal/entity/startgg"
)

func (c *Client) GetSets(phaseGroupID int64, page int, perPage int, states []int) ([]startgg.Nodes, error) {
	var variables = map[string]any{
		"phaseGroupId": phaseGroupID,
		"page":         page,
		"perPage":      perPage,
		"states":       states,
	}

	results, err := GetData[startgg.RawPhaseGroupSetsData](c, startgg.GetPhaseGroupSets, variables)
	if err != nil {
		return nil, err
	}

	return results.Data.PhaseGroup.Sets.Nodes, nil
}
