package participant_accounts_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantAccounts_Edit_Create(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantAccountsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	err := repository.Edit(
		ctx,
		participantID,
		"discord",
		"discord-id",
		nil,
		"Kazuya#0001",
		true,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	account, err := repository.GetByPlatform(
		ctx,
		"discord",
		"discord-id",
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
		"Kazuya#0001",
		account.PlatformLogin,
	)

	testutil.RequireEqual(
		t,
		true,
		account.IsFound,
	)
}

func TestParticipantAccounts_Edit_Update(t *testing.T) {
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
			PlatformName:  "discord",
			PlatformID:    "old-id",
			PlatformLogin: "OldName",
			IsFound:       false,
		},
	)

	channel := "channel-123"

	err := repository.Edit(
		ctx,
		participantID,
		"discord",
		"new-id",
		&channel,
		"NewName",
		true,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	account, err := repository.GetByLogin(
		ctx,
		"discord",
		"NewName",
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireEqual(
		t,
		"new-id",
		account.PlatformId,
	)

	testutil.RequireEqual(
		t,
		"NewName",
		account.PlatformLogin,
	)

	testutil.RequireEqual(
		t,
		true,
		account.IsFound,
	)

	testutil.RequireNotNil(
		t,
		account.DmChannelId,
	)

	testutil.RequireEqual(
		t,
		"channel-123",
		*account.DmChannelId,
	)
}

func TestParticipantAccounts_EditDmChannel(t *testing.T) {
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

	channelID := "new-channel-id"

	err := repository.EditDmChannel(
		ctx,
		participantID,
		"discord",
		&channelID,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	account, err := repository.GetByPlatform(
		ctx,
		"discord",
		"discord-id",
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireNotNil(
		t,
		account.DmChannelId,
	)

	testutil.RequireEqual(
		t,
		"new-channel-id",
		*account.DmChannelId,
	)
}

func TestParticipantAccounts_EditDmChannel_Clear(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantAccountsRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
		},
	)

	oldChannel := "old-channel"

	testutil.InsertParticipantAccount(
		t,
		db,
		testutil.ParticipantAccountFixture{
			ParticipantID: participantID,
			PlatformName:  "discord",
			PlatformID:    "discord-id",
			DmChannelID:   &oldChannel,
			PlatformLogin: "Jin",
			IsFound:       true,
		},
	)

	err := repository.EditDmChannel(
		ctx,
		participantID,
		"discord",
		nil,
	)

	testutil.RequireNoError(
		t,
		err,
	)

	account, err := repository.GetByPlatform(
		ctx,
		"discord",
		"discord-id",
	)

	testutil.RequireNoError(
		t,
		err,
	)

	testutil.RequireNil(
		t,
		account.DmChannelId,
	)
}
