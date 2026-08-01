package participant_bans_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantBans_Add(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	id, err := repository.Add(
		ctx,
		participantID,
		"manual",
		"toxic behavior",
		nil,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireTrue(
		t,
		id > 0,
	)

	ban, err := repository.Get(
		ctx,
		id,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		participantID,
		ban.ParticipantId,
	)

	testutil.RequireEqual(
		t,
		"manual",
		ban.TypeBan,
	)

	testutil.RequireEqual(
		t,
		"toxic behavior",
		ban.Reason,
	)
}

func TestParticipantBans_Add_UpdateExisting(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	_, err := repository.Add(
		ctx,
		participantID,
		"manual",
		"old reason",
		nil,
	)

	testutil.RequireNoError(t, err)

	id, err := repository.Add(
		ctx,
		participantID,
		"admin",
		"new reason",
		nil,
	)

	testutil.RequireNoError(t, err)

	ban, err := repository.Get(
		ctx,
		id,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		"admin",
		ban.TypeBan,
	)

	testutil.RequireEqual(
		t,
		"new reason",
		ban.Reason,
	)
}
