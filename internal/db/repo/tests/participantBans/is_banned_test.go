package participant_bans_test

import (
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantBans_IsBanned_Permanent(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	_, err := repository.Add(
		ctx,
		participantID,
		"manual",
		"cheating",
		nil,
	)

	testutil.RequireNoError(t, err)

	isBanned, err := repository.IsBanned(
		ctx,
		participantID,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		true,
		isBanned,
	)
}

func TestParticipantBans_IsBanned_ActiveExpireDate(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	expiresAt := time.Now().Add(
		24 * time.Hour,
	)

	_, err := repository.Add(
		ctx,
		participantID,
		"temporary",
		"rage quit",
		&expiresAt,
	)

	testutil.RequireNoError(t, err)

	isBanned, err := repository.IsBanned(
		ctx,
		participantID,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		true,
		isBanned,
	)
}

func TestParticipantBans_IsBanned_Expired(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Paul",
		},
	)

	expiresAt := time.Now().Add(
		-24 * time.Hour,
	)

	_, err := repository.Add(
		ctx,
		participantID,
		"temporary",
		"old ban",
		&expiresAt,
	)

	testutil.RequireNoError(t, err)

	isBanned, err := repository.IsBanned(
		ctx,
		participantID,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		false,
		isBanned,
	)
}
