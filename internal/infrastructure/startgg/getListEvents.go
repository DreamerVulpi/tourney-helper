package startgg

import (
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func (c *Client) GetTournament(tourneySlug string) (startgg.Tournament, error) {
	var variables = map[string]any{
		"tourneySlug": tourneySlug,
	}

	results, err := GetData[startgg.RawTournamentData](c, startgg.GetTournament, variables)
	if err != nil {
		return startgg.Tournament{}, err
	}

	return results.Data.Tournament, nil
}
