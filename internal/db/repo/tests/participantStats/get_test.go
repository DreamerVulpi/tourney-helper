package participant_stats_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantStats_GetByGame(t *testing.T) {
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
			GameID:        "kaz123",
			Rating:        1500,
		},
	)

	stat, err := repository.GetByGame(
		ctx,
		participantID,
		"tekken 8",
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		participantID,
		stat.ParticipantId,
	)

	testutil.RequireEqual(
		t,
		"Tekken 8",
		stat.GameName,
	)

	testutil.RequireEqual(
		t,
		"kaz123",
		stat.GameId,
	)

	testutil.RequireEqual(
		t,
		1500,
		stat.Rating,
	)
}

func TestParticipantStats_GetByGame_NotFound(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	_, err := repository.GetByGame(
		ctx,
		participantID,
		"Tekken 8",
	)

	testutil.RequireError(t, err)
}

func TestParticipantStats_GetById(t *testing.T) {
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
			Rating:        1800,
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

	stats, err := repository.GetById(
		ctx,
		participantID,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		2,
		len(stats),
	)

	testutil.RequireEqual(
		t,
		"Tekken 8",
		stats[0].GameName,
	)

	testutil.RequireEqual(
		t,
		"SF6",
		stats[1].GameName,
	)
}
