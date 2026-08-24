package participant_stats_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantStats_Add(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
			Region:   "JP",
			Locale:   "ja",
		},
	)

	id, err := repository.Add(
		ctx,
		participantID,
		"Tekken 8",
		"kazuya123",
		1500,
	)

	testutil.RequireNoError(t, err)
	testutil.RequireTrue(t, id > 0)

	stats, err := repository.GetByGame(
		ctx,
		participantID,
		"Tekken 8",
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		"kazuya123",
		stats.GameId,
	)

	testutil.RequireEqual(
		t,
		1500,
		stats.Rating,
	)
}

func TestParticipantStats_Add_UpdateExisting(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	_, err := repository.Add(
		ctx,
		participantID,
		"Tekken 8",
		"old_id",
		1000,
	)

	testutil.RequireNoError(t, err)

	_, err = repository.Add(
		ctx,
		participantID,
		"Tekken 8",
		"new_id",
		2000,
	)

	testutil.RequireNoError(t, err)

	stat, err := repository.GetByGame(
		ctx,
		participantID,
		"Tekken 8",
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		"new_id",
		stat.GameId,
	)

	testutil.RequireEqual(
		t,
		2000,
		stat.Rating,
	)
}
