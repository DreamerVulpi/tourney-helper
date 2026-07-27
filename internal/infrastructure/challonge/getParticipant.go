package challonge

import (
	"context"
	"fmt"

	"github.com/dreamervulpi/tourney-helper/internal/entity/challonge"
)

func (c *Client) GetParticipant(ctx context.Context, tourneySlug string, participantId string) (challonge.ParticipantOutput, error) {
	slug := ExtractSlug(tourneySlug)

	result, err := GetData[challonge.ApidogParticipantResponse](c, ctx, challonge.GetParticipant, slug, participantId)
	if err != nil {
		return challonge.ParticipantOutput{}, fmt.Errorf("getParticipant | Error getting data: %w", err)
	}

	return challonge.ParticipantOutput{
		ID:           result.Data.ID,
		FinalRank:    result.Data.Attributes.FinalRank,
		GroupID:      result.Data.Attributes.GroupID,
		Misc:         result.Data.Attributes.Misc,
		Name:         result.Data.Attributes.Name,
		Seed:         result.Data.Attributes.Seed,
		States:       result.Data.Attributes.States,
		Timestamps:   result.Data.Attributes.Timestamps,
		TournamentID: result.Data.Attributes.TournamentID,
		Username:     result.Data.Attributes.Username,
		LinkCheckIn:  fmt.Sprintf(challonge.GetCheckIn, slug, result.Data.ID),
	}, nil
}
