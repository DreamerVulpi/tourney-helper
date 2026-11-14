package startgg

import (
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func (c *Client) GetConnectionsBracket(
	phaseGroupID int64,
	perPage int,
) ([]startgg.WidgetSetNode, startgg.WidgetPhaseGroupRef, error) {
	var info startgg.WidgetPhaseGroupRef

	nodes, err := GetAllPages(
		func(page int) ([]startgg.WidgetSetNode, int, error) {
			var variables = map[string]any{
				"phaseGroupId": phaseGroupID,
				"page":         page,
				"perPage":      perPage,
			}

			results, err := GetData[startgg.WidgetPhaseGroupSetsResponse](c, startgg.GetConnectionsBracket, variables)
			if err != nil {
				return nil, 0, err
			}

			if page == 1 && results.Data.PhaseGroup.Id != 0 {
				info = startgg.WidgetPhaseGroupRef{
					Id:                results.Data.PhaseGroup.Id,
					DisplayIdentifier: results.Data.PhaseGroup.DisplayIdentifier,
					Phase:             results.Data.PhaseGroup.Phase,
				}
			}

			return results.Data.PhaseGroup.Sets.Nodes, results.Data.PhaseGroup.Sets.PageInfo.Total, nil
		}, perPage,
	)

	return nodes, info, err
}
