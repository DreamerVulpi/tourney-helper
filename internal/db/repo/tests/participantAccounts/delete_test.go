package participant_accounts_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantAccounts_DelByPlatform(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantAccountsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	testutil.InsertParticipantAccount(
		t,
		db,
		testutil.ParticipantAccountFixture{
			ParticipantID: participantID,
			PlatformName:  "discord",
			PlatformID:    "discord-id",
			PlatformLogin: "Kazuya",
			IsFound:       true,
		},
	)

	err := repository.DelByPlatform(
		ctx,
		participantID,
		"discord",
		"discord-id",
	)

	testutil.RequireNoError(
		t,
		err,
	)

	_, err = repository.GetByPlatform(
		ctx,
		"discord",
		"discord-id",
	)

	testutil.RequireError(
		t,
		err,
	)
}

func TestParticipantAccounts_DelByPlatform_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantAccountsRepo(t)

	err := repository.DelByPlatform(
		ctx,
		999,
		"discord",
		"unknown-id",
	)

	testutil.RequireError(
		t,
		err,
	)
}
