package sentset_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestSentSet_Delete(t *testing.T) {
	repository, db, ctx := testutil.NewSentSetRepo(t)

	testutil.InsertSentSet(
		t,
		db,
		testutil.SentSetFixture{
			SetID:              400,
			TournamentPlatform: "startgg",
			MessengerPlatform:  "discord",
			TournamentSlug:     "cup",
			State:              1,
		},
	)

	err := repository.Del(
		ctx,
		400,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	exists, err := repository.Exists(
		ctx,
		400,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		false,
		exists,
	)
}

func TestSentSet_Delete_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewSentSetRepo(t)

	err := repository.Del(
		ctx,
		999,
	)

	testutil.RequireError(
		t,
		err,
	)
}
