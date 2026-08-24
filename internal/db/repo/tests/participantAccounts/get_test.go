package participant_accounts_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantAccounts_GetById(t *testing.T) {
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
			PlatformID:    "discord-123",
			PlatformLogin: "Kazuya#1234",
			IsFound:       true,
		},
	)

	testutil.InsertParticipantAccount(
		t,
		db,
		testutil.ParticipantAccountFixture{
			ParticipantID: participantID,
			PlatformName:  "startgg",
			PlatformID:    "startgg-456",
			PlatformLogin: "Kazuya",
			IsFound:       true,
		},
	)

	accounts, err := repository.GetById(
		ctx,
		participantID,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		2,
		len(accounts),
	)

	platforms := make(map[string]bool)

	for _, account := range accounts {
		platforms[account.PlatformName] = true
	}

	testutil.RequireEqual(
		t,
		true,
		platforms["discord"],
	)

	testutil.RequireEqual(
		t,
		true,
		platforms["startgg"],
	)
}

func TestParticipantAccounts_GetById_Empty(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantAccountsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	accounts, err := repository.GetById(
		ctx,
		participantID,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		0,
		len(accounts),
	)
}

func TestParticipantAccounts_GetByLogin(t *testing.T) {
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
			PlatformID:    "123456",
			PlatformLogin: "Kazuya#1234",
			IsFound:       true,
		},
	)

	account, err := repository.GetByLogin(
		ctx,
		"discord",
		"Kazuya#1234",
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
		"123456",
		account.PlatformId,
	)
}

func TestParticipantAccounts_GetByLogin_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantAccountsRepo(t)

	_, err := repository.GetByLogin(
		ctx,
		"discord",
		"unknown",
	)

	testutil.RequireError(
		t,
		err,
	)
}

func TestParticipantAccounts_GetByPlatform(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantAccountsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	testutil.InsertParticipantAccount(
		t,
		db,
		testutil.ParticipantAccountFixture{
			ParticipantID: participantID,
			PlatformName:  "startgg",
			PlatformID:    "player-789",
			PlatformLogin: "Jin",
			IsFound:       true,
		},
	)

	account, err := repository.GetByPlatform(
		ctx,
		"startgg",
		"player-789",
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
		"startgg",
		account.PlatformName,
	)

	testutil.RequireEqual(
		t,
		"player-789",
		account.PlatformId,
	)
}

func TestParticipantAccounts_GetByPlatform_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantAccountsRepo(t)

	_, err := repository.GetByPlatform(
		ctx,
		"discord",
		"unknown-id",
	)

	testutil.RequireError(
		t,
		err,
	)
}
