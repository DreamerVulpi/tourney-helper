package participants_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipants_Del(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	id, err := repository.Add(
		ctx,
		"Steve",
		"UK",
		"en",
	)
	testutil.RequireNoError(t, err)

	err = repository.Del(ctx, id)
	testutil.RequireNoError(t, err)

	_, err = repository.GetById(ctx, id)

	testutil.RequireError(t, err)
}

func TestParticipants_Del_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	err := repository.Del(
		ctx,
		999,
	)

	testutil.RequireError(t, err)
}
