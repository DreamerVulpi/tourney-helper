package participant_bans_test

import (
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantBans_Get(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantBansRepo(t)

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
		},
	)

	expiresAt := time.Now().Add(
		48 * time.Hour,
	)

	banID, err := repository.Add(
		ctx,
		participantID,
		"temporary",
		"rage quit",
		&expiresAt,
	)

	testutil.RequireNoError(t, err)

	ban, err := repository.Get(
		ctx,
		banID,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		banID,
		ban.Id,
	)

	testutil.RequireEqual(
		t,
		participantID,
		ban.ParticipantId,
	)

	testutil.RequireEqual(
		t,
		"temporary",
		ban.TypeBan,
	)

	testutil.RequireEqual(
		t,
		"rage quit",
		ban.Reason,
	)

	testutil.RequireNotNil(
		t,
		ban.ExpiresAt,
	)
}

func TestParticipantBans_Get_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantBansRepo(t)

	_, err := repository.Get(
		ctx,
		999999,
	)

	testutil.RequireError(
		t,
		err,
	)
}

func TestParticipantBans_GetList(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantBansRepo(t)
	defer db.Close()

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "PlayerOne",
			Region:   "EU",
			Locale:   "en",
		},
	)

	testutil.InsertParticipantAccount(
		t,
		db,
		testutil.ParticipantAccountFixture{
			ParticipantID: participantID,
			PlatformName:  "discord",
			PlatformID:    "123456",
			PlatformLogin: "player#0001",
			IsFound:       true,
		},
	)

	testutil.InsertParticipantAccount(
		t,
		db,
		testutil.ParticipantAccountFixture{
			ParticipantID: participantID,
			PlatformName:  "startgg",
			PlatformID:    "789",
			PlatformLogin: "player-start",
			IsFound:       true,
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: participantID,
			GameName:      "Tekken 8",
			GameID:        "steam_123",
			Rating:        1500,
		},
	)

	testutil.InsertParticipantBan(
		t,
		db,
		testutil.ParticipantBanFixture{
			ParticipantID: participantID,
			TypeBan:       "manual",
			Reason:        "Toxic behavior",
			ExpiresAt:     nil,
		},
	)

	list, err := repo.GetList(
		ctx,
		"discord",
		"startgg",
		"Tekken 8",
		10,
		0,
		"",
	)

	testutil.RequireNoError(t, err)
	testutil.RequireNotEmpty(t, list)

	got := list[0]

	testutil.RequireEqual(
		t,
		participantID,
		got.Id,
	)

	testutil.RequireEqual(
		t,
		"PlayerOne",
		got.GameNickname,
	)

	testutil.RequireEqual(
		t,
		"EU",
		got.Region,
	)

	testutil.RequireEqual(
		t,
		"en",
		got.Locale,
	)

	testutil.RequireEqual(
		t,
		"discord",
		got.MessengerName,
	)

	testutil.RequireEqual(
		t,
		"player#0001",
		got.MessengerLogin,
	)

	testutil.RequireEqual(
		t,
		"startgg",
		got.TournamentPlatformName,
	)

	testutil.RequireEqual(
		t,
		"player-start",
		got.TournamentPlatformLogin,
	)

	testutil.RequireEqual(
		t,
		"Tekken 8",
		got.GameName,
	)

	testutil.RequireEqual(
		t,
		"steam_123",
		got.GameID,
	)

	testutil.RequireEqual(
		t,
		1500,
		got.Rating,
	)

	testutil.RequireEqual(
		t,
		"banned",
		got.IsBanned,
	)

	testutil.RequireEqual(
		t,
		"manual",
		got.TypeBan,
	)

	testutil.RequireEqual(
		t,
		"Toxic behavior",
		got.Reason,
	)

	testutil.RequireTrue(
		t,
		got.IsFound,
	)
}

func TestParticipantBans_GetList_ExpiredBan(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantBansRepo(t)
	defer db.Close()

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "ExpiredPlayer",
			Region:   "EU",
			Locale:   "en",
		},
	)

	expired := time.Date(
		2020,
		1,
		1,
		0,
		0,
		0,
		0,
		time.UTC,
	)

	testutil.InsertParticipantBan(
		t,
		db,
		testutil.ParticipantBanFixture{
			ParticipantID: participantID,
			TypeBan:       "temporary",
			Reason:        "Expired",
			ExpiresAt:     &expired,
		},
	)

	list, err := repo.GetList(
		ctx,
		"discord",
		"startgg",
		"",
		10,
		0,
		"",
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEmpty(t, list)
}

func TestParticipantBans_GetList_SearchMessengerLogin(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantBansRepo(t)
	defer db.Close()

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Unknown",
			Region:   "EU",
			Locale:   "en",
		},
	)

	testutil.InsertParticipantAccount(
		t,
		db,
		testutil.ParticipantAccountFixture{
			ParticipantID: participantID,
			PlatformName:  "discord",
			PlatformID:    "999",
			PlatformLogin: "special_player",
			IsFound:       true,
		},
	)

	testutil.InsertParticipantBan(
		t,
		db,
		testutil.ParticipantBanFixture{
			ParticipantID: participantID,
			TypeBan:       "manual",
			Reason:        "test",
		},
	)

	list, err := repo.GetList(
		ctx,
		"discord",
		"",
		"",
		10,
		0,
		"special_player",
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, 1, len(list))

	testutil.RequireEqual(
		t,
		"special_player",
		list[0].MessengerLogin,
	)
}
