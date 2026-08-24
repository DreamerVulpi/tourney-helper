package participants_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipants_Edit(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	id, err := repository.Add(
		ctx,
		"PlayerOne",
		"EU",
		"en",
	)
	testutil.RequireNoError(t, err)

	err = repository.Edit(
		ctx,
		id,
		"PlayerTwo",
		"US",
		"ru",
	)
	testutil.RequireNoError(t, err)

	player, err := repository.GetById(ctx, id)
	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, "PlayerTwo", player.Nickname)
	testutil.RequireEqual(t, "US", player.Region)
	testutil.RequireEqual(t, "ru", player.Locale)
}

func TestParticipants_Edit_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	err := repository.Edit(
		ctx,
		999,
		"Player",
		"EU",
		"en",
	)

	testutil.RequireError(t, err)
}

func TestParticipants_Edit_DuplicateNickname(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	id1, err := repository.Add(
		ctx,
		"PlayerOne",
		"EU",
		"en",
	)
	testutil.RequireNoError(t, err)

	_, err = repository.Add(
		ctx,
		"PlayerTwo",
		"EU",
		"en",
	)
	testutil.RequireNoError(t, err)

	err = repository.Edit(
		ctx,
		id1,
		"PlayerTwo",
		"US",
		"ru",
	)

	testutil.RequireError(t, err)
}
