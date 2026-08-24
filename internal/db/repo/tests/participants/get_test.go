package participants_test

import (
	"fmt"
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipants_GetById(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	id, err := repository.Add(
		ctx,
		"Kazuya",
		"JP",
		"ja",
	)
	testutil.RequireNoError(t, err)

	player, err := repository.GetById(ctx, id)
	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, "Kazuya", player.Nickname)
	testutil.RequireEqual(t, "JP", player.Region)
	testutil.RequireEqual(t, "ja", player.Locale)
}

func TestParticipants_GetById_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	_, err := repository.GetById(ctx, 999)

	testutil.RequireError(t, err)
}

func TestParticipants_GetByNickname(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	_, err := repository.Add(
		ctx,
		"Jin",
		"KR",
		"ko",
	)
	testutil.RequireNoError(t, err)

	player, err := repository.GetByNickname(
		ctx,
		"Jin",
	)
	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, "Jin", player.Nickname)
	testutil.RequireEqual(t, "KR", player.Region)
}

func TestParticipants_GetByNickname_NotFound(t *testing.T) {
	repository, _, ctx := testutil.NewParticipantsRepo(t)

	_, err := repository.GetByNickname(
		ctx,
		"Unknown",
	)

	testutil.RequireError(t, err)
}

func TestParticipants_GetList_Empty(t *testing.T) {
	repo, _, ctx := testutil.NewParticipantsRepo(t)

	list, err := repo.GetList(
		ctx,
		"discord",
		"startgg",
		"Tekken 8",
		20,
		0,
		"",
	)

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 0, len(list))
}

func TestParticipants_GetList(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player",
		Region:   "EU",
		Locale:   "en",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id,
		GameName:      "Tekken 8",
		GameID:        "Player1",
		Rating:        1800,
	})

	testutil.InsertParticipantAccount(t, db, testutil.ParticipantAccountFixture{
		ParticipantID: id,
		PlatformName:  "discord",
		PlatformID:    "123456",
		PlatformLogin: "player1",
		IsFound:       true,
	})

	testutil.InsertParticipantAccount(t, db, testutil.ParticipantAccountFixture{
		ParticipantID: id,
		PlatformName:  "startgg",
		PlatformID:    "987654",
		PlatformLogin: "PlayerTournament",
		IsFound:       true,
	})

	list, err := repo.GetList(
		ctx,
		"discord",
		"startgg",
		"Tekken 8",
		20,
		0,
		"",
	)

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))

	p := list[0]

	testutil.RequireEqual(t, id, p.Id)
	testutil.RequireEqual(t, true, p.IsFound)
	testutil.RequireEqual(t, "123456", p.MessengerID)
	testutil.RequireEqual(t, "987654", p.TournamentPlatformID)
	testutil.RequireEqual(t, "Player", p.GameNickname)
	testutil.RequireEqual(t, "Player1", p.GameID)
	testutil.RequireEqual(t, "player1", p.MessengerLogin)
	testutil.RequireEqual(t, "PlayerTournament", p.TournamentPlatformLogin)
	testutil.RequireEqual(t, "EU", p.Region)
	testutil.RequireEqual(t, "en", p.Locale)
	testutil.RequireEqual(t, 1800, p.Rating)
	testutil.RequireEqual(t, "discord", p.MessengerName)
	testutil.RequireEqual(t, "startgg", p.TournamentPlatformName)
	testutil.RequireEqual(t, "active", p.IsBanned)
}

func TestParticipants_GetList_SearchNickname(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id1 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Dreamer",
		Region:   "EU",
		Locale:   "en",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id1,
		GameName:      "Tekken 8",
		GameID:        "dreamer",
		Rating:        1800,
	})

	id2 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "AnotherPlayer",
		Region:   "NA",
		Locale:   "en",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id2,
		GameName:      "Tekken 8",
		GameID:        "another",
		Rating:        1500,
	})

	list, err := repo.GetList(
		ctx,
		"discord",
		"startgg",
		"Tekken 8",
		20,
		0,
		"dream",
	)

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))

	testutil.RequireEqual(t, id1, list[0].Id)
	testutil.RequireEqual(t, "Dreamer", list[0].GameNickname)
}

func TestParticipants_GetList_SearchMessengerLogin(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player",
		Region:   "EU",
		Locale:   "en",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id,
		GameName:      "Tekken 8",
		GameID:        "game1",
		Rating:        1500,
	})

	testutil.InsertParticipantAccount(t, db, testutil.ParticipantAccountFixture{
		ParticipantID: id,
		PlatformName:  "discord",
		PlatformID:    "123",
		PlatformLogin: "DreamDiscord",
		IsFound:       true,
	})

	list, err := repo.GetList(ctx, "discord", "startgg", "Tekken 8", 20, 0, "dream")

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))
	testutil.RequireEqual(t, id, list[0].Id)
}

func TestParticipants_GetList_SearchTournamentLogin(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id,
		GameName:      "Tekken 8",
	})

	testutil.InsertParticipantAccount(t, db, testutil.ParticipantAccountFixture{
		ParticipantID: id,
		PlatformName:  "startgg",
		PlatformLogin: "DreamTournament",
		IsFound:       true,
	})

	list, err := repo.GetList(ctx, "discord", "startgg", "Tekken 8", 20, 0, "dream")

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))
}

func TestParticipants_GetList_SearchGameID(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id,
		GameName:      "Tekken 8",
		GameID:        "TekkenMaster",
	})

	list, err := repo.GetList(ctx, "discord", "startgg", "Tekken 8", 20, 0, "master")

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))
}

func TestParticipants_GetList_GameFilter(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id1 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "TekkenPlayer",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id1,
		GameName:      "Tekken 8",
	})

	id2 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "SFPlayer",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id2,
		GameName:      "SF6",
	})

	list, err := repo.GetList(ctx, "discord", "startgg", "Tekken 8", 20, 0, "")

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))
	testutil.RequireEqual(t, id1, list[0].Id)
}

func TestParticipants_GetList_LimitOffset(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	for i := 1; i <= 5; i++ {
		id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
			Nickname: fmt.Sprintf("Player%d", i),
		})

		testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
			ParticipantID: id,
			GameName:      "Tekken 8",
		})
	}

	list, err := repo.GetList(ctx, "discord", "startgg", "Tekken 8", 2, 2, "")

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 2, len(list))
}

func TestParticipants_GetList_Banned(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player",
	})

	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: id,
		GameName:      "Tekken 8",
	})

	testutil.InsertParticipantBan(t, db, testutil.ParticipantBanFixture{
		ParticipantID: id,
		TypeBan:       "temporary",
		Reason:        "Spam",
		ExpiresAt:     nil,
	})

	list, err := repo.GetList(
		ctx,
		"discord",
		"startgg",
		"Tekken 8",
		20,
		0,
		"",
	)

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))

	p := list[0]

	testutil.RequireEqual(t, "banned", p.IsBanned)
	testutil.RequireEqual(t, "temporary", p.TypeBan)
	testutil.RequireEqual(t, "Spam", p.Reason)

	testutil.RequireNotNil(t, p.BannedAt)
	testutil.RequireEqual(t, (*time.Time)(nil), p.ExpiresAt)
}

func TestParticipants_GetList_NoStats(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "NoStatsPlayer",
	})

	list, err := repo.GetList(
		ctx,
		"discord",
		"startgg",
		"Tekken 8",
		20,
		0,
		"",
	)

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, len(list))
	testutil.RequireEqual(t, id, list[0].Id)
}
