package participants_test

import (
	"context"
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipants_Add(t *testing.T) {
	repository, _, _ := testutil.NewParticipantsRepo(t)

	id, err := repository.Add(
		context.Background(),
		"PlayerOne",
		"EU",
		"en",
	)

	testutil.RequireNoError(t, err)

	participant, err := repository.GetById(
		context.Background(),
		id,
	)

	testutil.RequireNoError(t, err)

	if participant.Nickname != "PlayerOne" {
		t.Fatalf(
			"nickname = %s, want PlayerOne",
			participant.Nickname,
		)
	}

	if participant.Region != "EU" {
		t.Fatalf(
			"region = %s, want EU",
			participant.Region,
		)
	}

	if participant.Locale != "en" {
		t.Fatalf(
			"locale = %s, want en",
			participant.Locale,
		)
	}
}

func TestParticipants_Add_UpdateExisting(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	firstID, err := repository.Add(
		ctx,
		"PlayerOne",
		"EU",
		"en",
	)
	testutil.RequireNoError(t, err)

	secondID, err := repository.Add(
		ctx,
		"PlayerOne",
		"US",
		"ru",
	)
	testutil.RequireNoError(t, err)

	// Must update current note without create a new note
	testutil.RequireEqual(t, firstID, secondID)

	player, err := repository.GetById(ctx, firstID)
	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, player.Nickname, "PlayerOne")
	testutil.RequireEqual(t, player.Region, "US")
	testutil.RequireEqual(t, player.Locale, "ru")
}

func TestParticipants_Add_DoesNotOverwriteRegionWithND(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	id, err := repository.Add(
		ctx,
		"PlayerOne",
		"EU",
		"en",
	)
	testutil.RequireNoError(t, err)

	_, err = repository.Add(
		ctx,
		"PlayerOne",
		"N/D",
		"ru",
	)
	testutil.RequireNoError(t, err)

	player, err := repository.GetById(ctx, id)
	testutil.RequireNoError(t, err)

	// Region not must change
	testutil.RequireEqual(t, "EU", player.Region)

	// Locale must updated
	testutil.RequireEqual(t, "ru", player.Locale)
}

func TestParticipants_Add_DoesNotOverwriteRegionWithEmptyString(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	id, err := repository.Add(
		ctx,
		"PlayerOne",
		"EU",
		"en",
	)
	testutil.RequireNoError(t, err)

	_, err = repository.Add(
		ctx,
		"PlayerOne",
		"",
		"ru",
	)
	testutil.RequireNoError(t, err)

	player, err := repository.GetById(ctx, id)
	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, "EU", player.Region)
	testutil.RequireEqual(t, "ru", player.Locale)
}
