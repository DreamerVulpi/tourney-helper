package participants_test

import (
	"testing"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipants_TotalCount(t *testing.T) {
	repository, db, ctx := testutil.NewParticipantsRepo(t)

	player1 := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Kazuya",
			Region:   "JP",
			Locale:   "ja",
		},
	)

	player2 := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Jin",
			Region:   "KR",
			Locale:   "ko",
		},
	)

	player3 := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Ryu",
			Region:   "JP",
			Locale:   "ja",
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: player1,
			GameName:      "Tekken 8",
			GameID:        "1",
			Rating:        1000,
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: player2,
			GameName:      "Tekken 8",
			GameID:        "2",
			Rating:        500,
		},
	)

	testutil.InsertParticipantStats(
		t,
		db,
		testutil.ParticipantStatsFixture{
			ParticipantID: player3,
			GameName:      "SF6",
			GameID:        "3",
			Rating:        700,
		},
	)

	count, err := repository.TotalCount(
		ctx,
		"Tekken 8",
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		2,
		count,
	)
}

func TestParticipants_TotalCountInRatingLeague_Empty(t *testing.T) {
	repo, _, ctx := testutil.NewParticipantsRepo(t)

	count, err := repo.TotalCountInRatingLeague(ctx, "Tekken 8")

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 0, count)
}

func TestParticipants_TotalCountInRatingLeague(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantsRepo(t)

	// Will be counted
	p1 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player1",
		Region:   "RU",
		Locale:   "ru",
	})
	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: p1,
		GameName:      "Tekken 8",
		GameID:        "player1",
		Rating:        1500,
	})

	// Won't be counted (rating = 0)
	p2 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player2",
		Region:   "RU",
		Locale:   "ru",
	})
	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: p2,
		GameName:      "Tekken 8",
		GameID:        "player2",
		Rating:        0,
	})

	// Wont be counted (other game)
	p3 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player3",
		Region:   "RU",
		Locale:   "ru",
	})
	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: p3,
		GameName:      "SF6",
		GameID:        "player3",
		Rating:        1800,
	})

	// Wont be counted (has ban)
	p4 := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player4",
		Region:   "RU",
		Locale:   "ru",
	})
	testutil.InsertParticipantStats(t, db, testutil.ParticipantStatsFixture{
		ParticipantID: p4,
		GameName:      "Tekken 8",
		GameID:        "player4",
		Rating:        2000,
	})

	testutil.InsertParticipantBan(t, db, testutil.ParticipantBanFixture{
		ParticipantID: p4,
		TypeBan:       "temporary",
		Reason:        "Spam",
	})

	count, err := repo.TotalCountInRatingLeague(ctx, "Tekken 8")

	testutil.RequireNoError(t, err)
	testutil.RequireEqual(t, 1, count)
}
