package sentset_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestSentSet_Get(t *testing.T) {
	repository, db, ctx := testutil.NewSentSetRepo(t)

	testutil.InsertSentSet(
		t,
		db,
		testutil.SentSetFixture{
			SetID:              200,
			TournamentPlatform: "challonge",
			MessengerPlatform:  "discord",
			TournamentSlug:     "cup",
			State:              1,
		},
	)

	set, err := repository.Get(
		ctx,
		200,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		int64(200),
		set.SetId,
	)

	testutil.RequireEqual(
		t,
		"challonge",
		set.TournamentPlatform,
	)
}

func TestSentSet_Get_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewSentSetRepo(t)

	_, err := repository.Get(
		ctx,
		999,
	)

	testutil.RequireError(
		t,
		err,
	)
}
