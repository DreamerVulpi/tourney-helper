package testutil

import (
	"context"
	"database/sql"
	"testing"

	repo "github.com/dreamervulpi/tourney-helper/internal/db/repo"
)

func NewParticipantsRepo(t *testing.T) (
	*repo.Participants,
	*sql.DB,
	context.Context,
) {
	t.Helper()

	db := NewTestDB(t)

	return &repo.Participants{
		Conn: db,
	}, db, context.Background()
}

func NewParticipantStatsRepo(t *testing.T) (
	*repo.ParticipantStats,
	*sql.DB,
	context.Context,
) {
	t.Helper()

	db := NewTestDB(t)

	return &repo.ParticipantStats{
		Conn: db,
	}, db, context.Background()
}

func NewParticipantBansRepo(t *testing.T) (
	*repo.ParticipantBans,
	*sql.DB,
	context.Context,
) {
	t.Helper()

	db := NewTestDB(t)

	return &repo.ParticipantBans{
		Conn: db,
	}, db, context.Background()
}

func NewParticipantAccountsRepo(
	t *testing.T,
) (*repo.ParticipantAccounts, *sql.DB, context.Context) {

	t.Helper()

	db := NewTestDB(t)

	return &repo.ParticipantAccounts{
		Conn: db,
	}, db, context.Background()
}

func NewSentSetRepo(
	t *testing.T,
) (*repo.SentSet, *sql.DB, context.Context) {
	t.Helper()

	db := NewTestDB(t)

	return &repo.SentSet{
		Conn: db,
	}, db, context.Background()
}
