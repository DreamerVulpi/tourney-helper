package testutil

import (
	"database/sql"
	"testing"
	"time"
)

type ParticipantFixture struct {
	Nickname string
	Region   string
	Locale   string
}

type ParticipantBanFixture struct {
	ParticipantID int
	TypeBan       string
	Reason        string
	ExpiresAt     *time.Time
}

type ParticipantStatsFixture struct {
	ParticipantID int
	GameName      string
	GameID        string
	Rating        int
}

type ParticipantAccountFixture struct {
	ParticipantID int
	PlatformName  string
	PlatformID    string
	DmChannelID   *string
	PlatformLogin string
	IsFound       bool
}

type SentSetFixture struct {
	SetID              int64
	TournamentPlatform string
	MessengerPlatform  string
	TournamentSlug     string
	State              int
	SentAtP1           *time.Time
	SentAtP2           *time.Time
}

func InsertParticipant(
	t *testing.T,
	db *sql.DB,
	f ParticipantFixture,
) int {
	t.Helper()

	var id int

	err := db.QueryRow(`
		INSERT INTO participants(
			nickname,
			region,
			locale
		)
		VALUES($1,$2,$3)
		RETURNING id
	`,
		f.Nickname,
		f.Region,
		f.Locale,
	).Scan(&id)

	RequireNoError(t, err)

	return id
}

func InsertParticipantStats(
	t *testing.T,
	db *sql.DB,
	f ParticipantStatsFixture,
) {
	t.Helper()

	_, err := db.Exec(`
		INSERT INTO participant_stats(
			participant_id,
			game_name,
			game_id,
			rating
		)
		VALUES($1,$2,$3,$4)
	`,
		f.ParticipantID,
		f.GameName,
		f.GameID,
		f.Rating,
	)

	RequireNoError(t, err)
}

func InsertParticipantBan(
	t *testing.T,
	db *sql.DB,
	f ParticipantBanFixture,
) int {
	t.Helper()

	var id int

	err := db.QueryRow(`
		INSERT INTO participant_bans(
			participant_id,
			type_ban,
			reason,
			expires_at
		)
		VALUES($1,$2,$3,$4)
		RETURNING id
	`,
		f.ParticipantID,
		f.TypeBan,
		f.Reason,
		f.ExpiresAt,
	).Scan(&id)

	RequireNoError(t, err)

	return id
}

func InsertParticipantAccount(
	t *testing.T,
	db *sql.DB,
	f ParticipantAccountFixture,
) int {
	t.Helper()

	var id int

	err := db.QueryRow(`
		INSERT INTO participant_accounts(
			participant_id,
			platform_name,
			platform_id,
			dm_channel_id,
			platform_login,
			is_found
		)
		VALUES($1,$2,$3,$4,$5,$6)
		RETURNING id
	`,
		f.ParticipantID,
		f.PlatformName,
		f.PlatformID,
		f.DmChannelID,
		f.PlatformLogin,
		f.IsFound,
	).Scan(&id)

	RequireNoError(t, err)

	return id
}

func InsertSentSet(
	t *testing.T,
	db *sql.DB,
	f SentSetFixture,
) int64 {
	t.Helper()

	var id int64

	err := db.QueryRow(`
		INSERT INTO sent_sets(
			set_id,
			tournament_platform,
			messenger_platform,
			tournament_slug,
			state,
			sent_at_p1,
			sent_at_p2
		)
		VALUES($1,$2,$3,$4,$5,$6,$7)
		RETURNING set_id
	`,
		f.SetID,
		f.TournamentPlatform,
		f.MessengerPlatform,
		f.TournamentSlug,
		f.State,
		f.SentAtP1,
		f.SentAtP2,
	).Scan(&id)

	RequireNoError(t, err)

	return id
}
