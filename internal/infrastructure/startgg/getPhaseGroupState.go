package startgg

import (
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func (c *Client) GetPhaseGroupState(phaseGroupID int64) (startgg.State, error) {
	var variables = map[string]any{
		"phaseGroupId": phaseGroupID,
	}

	results, err := GetData[startgg.RawPhaseGroupStateData](c, startgg.GetPhaseGroupState, variables)
	if err != nil {
		return 0, err
	}

	return startgg.State(results.Data.PhaseGroup.State), nil
}
