package participant_bans_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantBans_TotalCount_Empty(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantBansRepo(t)

	count, err := repository.TotalCount(
		ctx,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		0,
		count,
	)
}

func TestParticipantBans_TotalCount(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	player1 := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Player1",
		},
	)

	player2 := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Player2",
		},
	)

	_, err := repository.Add(
		ctx,
		player1,
		"manual",
		"reason",
		nil,
	)

	testutil.RequireNoError(t, err)

	_, err = repository.Add(
		ctx,
		player2,
		"manual",
		"reason",
		nil,
	)

	testutil.RequireNoError(t, err)

	count, err := repository.TotalCount(
		ctx,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		2,
		count,
	)
}
