package participant_stats_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantStats_ResetRating(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	player1 := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	player2 := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: player1,
			GameName:      "Tekken 8",
			Rating:        1500,
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: player2,
			GameName:      "Tekken 8",
			Rating:        1800,
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: player1,
			GameName:      "SF6",
			Rating:        2000,
		},
	)

	err := repository.ResetRating(
		ctx,
		"tekken 8",
	)

	testutil.RequireNoError(t, err)

	tekken1, err := repository.GetByGame(
		ctx,
		player1,
		"Tekken 8",
	)

	testutil.RequireNoError(t, err)

	tekken2, err := repository.GetByGame(
		ctx,
		player2,
		"Tekken 8",
	)

	testutil.RequireNoError(t, err)

	sf6, err := repository.GetByGame(
		ctx,
		player1,
		"SF6",
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, 0, tekken1.Rating)
	testutil.RequireEqual(t, 0, tekken2.Rating)

	testutil.RequireEqual(t, 2000, sf6.Rating)
}
