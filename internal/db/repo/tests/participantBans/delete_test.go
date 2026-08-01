package participant_bans_test

import (
	"testing"

	"time"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantBans_Delete(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Paul",
		},
	)

	_, err := repository.Add(
		ctx,
		participantID,
		"manual",
		"spam",
		nil,
	)

	testutil.RequireNoError(t, err)

	err = repository.Delete(
		ctx,
		participantID,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	isBanned, err := repository.IsBanned(
		ctx,
		participantID,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		false,
		isBanned,
	)
}

func TestParticipantBans_DeleteExpired(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	expiredPlayer := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Expired",
		},
	)

	activePlayer := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Active",
		},
	)

	permanentPlayer := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Permanent",
		},
	)

	// Expired ban
	expired := time.Now().Add(
		-24 * time.Hour,
	)

	_, err := repository.Add(
		ctx,
		expiredPlayer,
		"temporary",
		"old ban",
		&expired,
	)

	testutil.RequireNoError(t, err)

	// Active ban
	active := time.Now().Add(
		24 * time.Hour,
	)

	_, err = repository.Add(
		ctx,
		activePlayer,
		"temporary",
		"new ban",
		&active,
	)

	testutil.RequireNoError(t, err)

	// Permanent ban
	_, err = repository.Add(
		ctx,
		permanentPlayer,
		"permanent",
		"cheating",
		nil,
	)

	testutil.RequireNoError(t, err)

	err = repository.DeleteExpired(
		ctx,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	// Expired ban must be deleted
	isBanned, err := repository.IsBanned(
		ctx,
		expiredPlayer,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		false,
		isBanned,
	)

	// Active ban must be avaliable
	isBanned, err = repository.IsBanned(
		ctx,
		activePlayer,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		true,
		isBanned,
	)

	// Permanent ban must be avaliable
	isBanned, err = repository.IsBanned(
		ctx,
		permanentPlayer,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		true,
		isBanned,
	)
}
