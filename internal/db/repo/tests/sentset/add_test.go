package sentset_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/db"
)

func TestSentSet_Add(t *testing.T) {
	repository, _, ctx := testutil.NewSentSetRepo(t)
	state := entity.SetState(1)

	id, err := repository.Add(
		ctx,
		100,
		"startgg",
		"discord",
		"test-tournament",
		&state,
		nil,
		nil,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		int64(100),
		id,
	)

	set, err := repository.Get(ctx, id)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		"startgg",
		set.TournamentPlatform,
	)

	testutil.RequireEqual(
		t,
		"discord",
		set.MessengerPlatform,
	)
}

func TestSentSet_Add_UpdateConflict(t *testing.T) {
	repository, db, ctx := testutil.NewSentSetRepo(t)

	testutil.InsertSentSet(
		t,
		db,
		testutil.SentSetFixture{
			SetID:              100,
			TournamentPlatform: "startgg",
			MessengerPlatform:  "discord",
			TournamentSlug:     "old",
			State:              1,
		},
	)

	state := entity.SetState(2)

	_, err := repository.Add(
		ctx,
		100,
		"startgg",
		"discord",
		"new",
		&state,
		nil,
		nil,
	)

	testutil.RequireNoError(t, err)

	set, err := repository.Get(ctx, 100)

	testutil.RequireNoError(t, err)

	testutil.RequireNotNil(
		t,
		set.State,
	)

	testutil.RequireEqual(
		t,
		entity.SetState(2),
		*set.State,
	)

	// Important: slug must not change
	testutil.RequireEqual(
		t,
		"old",
		set.TournamentSlug,
	)
}
