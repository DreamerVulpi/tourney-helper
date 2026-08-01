package sentset_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestSentSet_Exists(t *testing.T) {
	repository, db, ctx := testutil.NewSentSetRepo(t)

	testutil.InsertSentSet(
		t,
		db,
		testutil.SentSetFixture{
			SetID:              100,
			TournamentPlatform: "startgg",
			MessengerPlatform:  "discord",
			TournamentSlug:     "my-tournament",
			State:              1,
		},
	)

	exists, err := repository.Exists(
		ctx,
		100,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		true,
		exists,
	)
}
