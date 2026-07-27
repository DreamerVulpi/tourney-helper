package challonge

import (
	"context"
	"fmt"
	"github.com/dreamervulpi/tourney-helper/internal/entity/challonge"
)

func (c *Client) GetTournament(ctx context.Context, tourneySlug string) (challonge.Tournament, error) {
	slug := ExtractSlug(tourneySlug)

	results, err := GetData[challonge.ApidogTournamentResponse](c, ctx, challonge.GetTournament, slug)
	if err != nil {
		return challonge.Tournament{}, fmt.Errorf("getTournament | Error getting data: %w", err)
	}

	if results == nil {
		return challonge.Tournament{}, fmt.Errorf("getTournament | API returned nil result for slug: %s", slug)
	}

	if results.Data == nil {
		return challonge.Tournament{}, fmt.Errorf("getTournament | Response 'data' field is missing for slug: %s (check API version or slug)", slug)
	}
	if results.Data.Attributes == nil {
		return challonge.Tournament{}, fmt.Errorf("getTournament | Tournament 'attributes' are missing for slug: %s", slug)
	}

	return *results.Data.Attributes, nil
}
