package participant_accounts_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantAccounts_Add(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantAccountsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	channelID := "123456"

	id, err := repository.Add(
		ctx,
		participantID,
		"discord",
		"discord-user-id",
		&channelID,
		"Kazuya#1234",
		true,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireTrue(
		t,
		id > 0,
	)

	account, err := repository.GetByPlatform(
		ctx,
		"discord",
		"discord-user-id",
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		participantID,
		account.ParticipantId,
	)

	testutil.RequireEqual(
		t,
		"discord",
		account.PlatformName,
	)

	testutil.RequireEqual(
		t,
		"Kazuya#1234",
		account.PlatformLogin,
	)

	testutil.RequireEqual(
		t,
		true,
		account.IsFound,
	)
}

func TestParticipantAccounts_Add_UpdateExisting(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantAccountsRepo(t)

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
		"discord",
		"old-id",
		nil,
		"OldName",
		false,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	id, err := repository.Add(
		ctx,
		participantID,
		"discord",
		"new-id",
		nil,
		"NewName",
		true,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	account, err := repository.GetByPlatform(
		ctx,
		"discord",
		"old-id",
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		id,
		account.Id,
	)

	testutil.RequireEqual(
		t,
		"old-id",
		account.PlatformId,
	)

	testutil.RequireEqual(
		t,
		"NewName",
		account.PlatformLogin,
	)
}
