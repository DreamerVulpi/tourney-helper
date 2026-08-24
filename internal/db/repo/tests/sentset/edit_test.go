package sentset_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/db"
)

func TestSentSet_Edit(t *testing.T) {
	repository, db, ctx := testutil.NewSentSetRepo(t)

	testutil.InsertSentSet(
		t,
		db,
		testutil.SentSetFixture{
			SetID:              300,
			TournamentPlatform: "startgg",
			MessengerPlatform:  "discord",
			TournamentSlug:     "old",
			State:              1,
		},
	)

	state := entity.SetState(3)

	err := repository.Edit(
		ctx,
		300,
		"challonge",
		"telegram",
		"new",
		&state,
		nil,
		nil,
	)

	testutil.RequireNoError(t, err)

	set, err := repository.Get(ctx, 300)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		"challonge",
		set.TournamentPlatform,
	)

	testutil.RequireEqual(
		t,
		"telegram",
		set.MessengerPlatform,
	)

	testutil.RequireNotNil(
		t,
		set.State,
	)

	testutil.RequireEqual(
		t,
		entity.SetState(3),
		*set.State,
	)
}
