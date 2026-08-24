package participant_stats_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantStats_EditRating(t *testing.T) {
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
			Rating:        1000,
		},
	)

	err := repository.EditRating(
		ctx,
		participantID,
		"tekken 8",
		2500,
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
		2500,
		stat.Rating,
	)

	testutil.RequireEqual(
		t,
		"kaz123",
		stat.GameId,
	)
}

func TestParticipantStats_EditRating_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantStatsRepo(t)

	err := repository.EditRating(
		ctx,
		999,
		"Tekken 8",
		2000,
	)

	testutil.RequireError(t, err)
}

func TestParticipantStats_Edit_Create(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	err := repository.Edit(
		ctx,
		participantID,
		"Tekken 8",
		"kazuya-id",
		1800,
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
		"kazuya-id",
		stat.GameId,
	)

	testutil.RequireEqual(
		t,
		1800,
		stat.Rating,
	)
}

func TestParticipantStats_Edit_Update(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantStatsRepo(t)

	participantID := testutil.InsertParticipant(
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
			ParticipantID: participantID,
			GameName:      "Tekken 8",
			GameID:        "old-id",
			Rating:        1000,
		},
	)

	err := repository.Edit(
		ctx,
		participantID,
		"Tekken 8",
		"new-id",
		2500,
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
		"new-id",
		stat.GameId,
	)

	testutil.RequireEqual(
		t,
		2500,
		stat.Rating,
	)
}
