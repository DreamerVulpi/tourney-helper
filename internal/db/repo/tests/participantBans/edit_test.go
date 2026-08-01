package participant_bans_test

import (
	"testing"
	"time"

	"github.com/dreamervulpi/tourney-helper/internal/db/repo/tests/testutil"
)

func TestParticipantBans_Edit(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantBansRepo(t)

	id := testutil.InsertParticipant(t, db, testutil.ParticipantFixture{
		Nickname: "Player",
		Region:   "EU",
		Locale:   "en",
	})

	expire := time.Now().Add(48 * time.Hour)

	_, err := repo.Add(
		ctx,
		id,
		"temporary",
		"Old reason",
		nil,
	)

	testutil.RequireNoError(t, err)

	err = repo.Edit(
		ctx,
		id,
		"permanent",
		"New reason",
		&expire,
	)

	testutil.RequireNoError(t, err)

	ban, err := repo.Get(ctx, id)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(t, "permanent", ban.TypeBan)
	testutil.RequireEqual(t, "New reason", ban.Reason)

	if ban.ExpiresAt == nil {
		t.Fatal("ExpiresAt is nil")
	}

	testutil.RequireEqual(
		t,
		expire.Unix(),
		ban.ExpiresAt.Unix(),
	)
}

func TestParticipantBans_Edit_CreateIfNotExists(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantBansRepo(t)
	defer db.Close()

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "NewPlayer",
			Region:   "EU",
			Locale:   "en",
		},
	)

	err := repo.Edit(
		ctx,
		participantID,
		"manual",
		"Test ban",
		nil,
	)

	testutil.RequireNoError(t, err)

	var (
		typeBan string
		reason  string
	)

	err = db.QueryRow(`
		SELECT
			type_ban,
			reason
		FROM participant_bans
		WHERE participant_id = $1
	`,
		participantID,
	).Scan(
		&typeBan,
		&reason,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		"manual",
		typeBan,
	)

	testutil.RequireEqual(
		t,
		"Test ban",
		reason,
	)
}

func TestParticipantBans_Edit_UpdateExisting(t *testing.T) {
	repo, db, ctx := testutil.NewParticipantBansRepo(t)
	defer db.Close()

	participantID := testutil.InsertParticipant(
		t,
		db,
		testutil.ParticipantFixture{
			Nickname: "Player",
			Region:   "EU",
			Locale:   "en",
		},
	)

	testutil.InsertParticipantBan(
		t,
		db,
		testutil.ParticipantBanFixture{
			ParticipantID: participantID,
			TypeBan:       "temporary",
			Reason:        "Old reason",
		},
	)

	err := repo.Edit(
		ctx,
		participantID,
		"permanent",
		"Updated reason",
		nil,
	)

	testutil.RequireNoError(t, err)

	var (
		typeBan string
		reason  string
		count   int
	)

	err = db.QueryRow(`
		SELECT
			COUNT(*)
		FROM participant_bans
		WHERE participant_id = $1
	`,
		participantID,
	).Scan(&count)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		1,
		count,
	)

	err = db.QueryRow(`
		SELECT
			type_ban,
			reason
		FROM participant_bans
		WHERE participant_id = $1
	`,
		participantID,
	).Scan(
		&typeBan,
		&reason,
	)

	testutil.RequireNoError(t, err)

	testutil.RequireEqual(
		t,
		"permanent",
		typeBan,
	)

	testutil.RequireEqual(
		t,
		"Updated reason",
		reason,
	)
}
