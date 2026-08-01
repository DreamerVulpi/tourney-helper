package participant_stats_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantStats_DelByGame(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: participantID,
			GameName:      "Tekken 8",
			GameID:        "tekken-id",
			Rating:        1500,
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: participantID,
			GameName:      "SF6",
			GameID:        "sf-id",
			Rating:        2000,
		},
	)

	err := repository.DelByGame(
		ctx,
		participantID,
		"tekken 8",
	)

	testutil.RequireNoError(t, err)

	stats, err := repository.GetById(
		ctx,
		participantID,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		1,
		len(stats),
	)

	testutil.RequireEqual(
		t,
		"SF6",
		stats[0].GameName,
	)
}

func TestParticipantStats_DelByGame_NotFound(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	err := repository.DelByGame(
		ctx,
		participantID,
		"Tekken 8",
	)

	testutil.RequireError(t, err)
}
