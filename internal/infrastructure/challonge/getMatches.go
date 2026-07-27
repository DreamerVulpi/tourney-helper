package challonge

import (
	"context"
	"fmt"
	"github.com/dreamervulpi/tourney-helper/internal/entity/challonge"
)

func (c *Client) GetMatches(ctx context.Context, tourneySlug string, states []challonge.State) ([]challonge.MatchOutput, error) {
	slug := ExtractSlug(tourneySlug)
	var variables = map[string]any{
		"slug":      slug,
		"variables": states,
	}

	results, err := GetData[challonge.ApidogMatchesResponse](c, ctx, challonge.GetMatches, variables)
	if err != nil {
		return nil, fmt.Errorf("getMatches | Error getting data: %w", err)
	}

	var matches []challonge.MatchOutput
	for _, m := range results.Data {
		attr := m.Attributes
		attr.ID = m.ID
		attr.Relationships = m.Relationships
		matches = append(matches, attr)
	}
	return matches, nil
}
