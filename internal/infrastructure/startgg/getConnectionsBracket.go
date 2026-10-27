package startgg

import (
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func (c *Client) GetConnectionsBracket(phaseGroupID int64, perPage int) ([]startgg.WidgetSetNode, error) {
	return GetAllPages(
		func(page int) ([]startgg.WidgetSetNode, int, error) {
			var variables = map[string]any{
				"phaseGroupId": phaseGroupID,
				"page":         page,
				"perPage":      perPage,
				"states":       []int{1, 2, 3},
			}

			results, err := GetData[startgg.WidgetPhaseGroupSetsResponse](c, startgg.GetConnectionsBracket, variables)
			if err != nil {
				return nil, 0, err
			}
			return results.Data.PhaseGroup.Sets.Nodes, results.Data.PhaseGroup.Sets.PageInfo.Total, nil
		}, perPage,
	)
}
