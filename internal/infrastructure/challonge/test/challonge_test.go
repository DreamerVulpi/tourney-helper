package challonge

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"testing"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/challonge"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/challonge"
	"github.com/stretchr/testify/assert"
)

func TestGetDataChallonge(t *testing.T) {
	rawData, err := os.ReadFile("rawDataMatches.json")
	if err != nil {
		t.Fatalf("Failed to read rawDataMatches.json: %v", err)
	}

	expectedFirstMatch := entity.ModelMatches{
		ID:   "186702200",
		Type: "match",
		Attributes: entity.MatchOutput{
			State:              entity.Complete,
			Round:              1,
			Identifier:         "A",
			Scores:             "0 - 2",
			SuggestedPlayOrder: 1,
			ScoreInSets:        [][]int{{0, 2}},
			PointsByParticipant: []entity.PointRecord{
				{ParticipantID: strconv.Itoa(112579135), Scores: []int{0}},
				{ParticipantID: strconv.Itoa(112579132), Scores: []int{2}},
			},
			Timestamps: entity.Timestamps{
				StartedAt:  "2020-01-11T14:00:50.421Z",
				CreatedAt:  "2020-01-11T14:00:50.273Z",
				UpdatedAt:  "2020-01-11T14:31:49.537Z",
				UnderwayAt: "",
			},
			WinnerID: 112579132,
		},
		Relationships: entity.MatchRelationships{
			Player1: &entity.PlayerRelation{
				Data: &entity.PlayerData{
					ID:   "112579135",
					Type: "participant",
				},
			},
			Player2: &entity.PlayerRelation{
				Data: &entity.PlayerData{
					ID:   "112579132",
					Type: "participant",
				},
			},
		},
	}

	var actualResponse entity.ApidogMatchesResponse
	err = json.Unmarshal(rawData, &actualResponse)
	if err != nil {
		assert.NoError(t, fmt.Errorf("JSON Unmarshal failed - %w", err))
	}

	assert.Equal(t, 8, len(actualResponse.Data))

	actualFirstMatch := actualResponse.Data[0]

	assert.Equal(t, expectedFirstMatch.ID, actualFirstMatch.ID)
	assert.Equal(t, expectedFirstMatch.Attributes.Identifier, actualFirstMatch.Attributes.Identifier)
	assert.Equal(t, expectedFirstMatch.Attributes.State, actualFirstMatch.Attributes.State)
	assert.Equal(t, expectedFirstMatch.Attributes.WinnerID, actualFirstMatch.Attributes.WinnerID)

	assert.NotNil(t, actualFirstMatch.Relationships.Player1)
	assert.Equal(t, "112579135", actualFirstMatch.Relationships.Player1.Data.ID)
}

func TestExtractSlug(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"https://entity.com/tournament123", "tournament123"},
		{"https://entity.com/tournament123/", "tournament123"},
		{"my_tourney", "my_tourney"},
	}

	for _, tc := range tests {
		assert.Equal(t, tc.expected, challonge.ExtractSlug(tc.input))
	}
}
