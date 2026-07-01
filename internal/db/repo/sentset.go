package repo

import (
	"context"
	"fmt"
	"time"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type SentSet struct {
	Conn entity.SQLHandler
}

// Change type connection from usual to transaction
func (p *SentSet) WithTx(tx entity.SQLHandler) entity.SentSetRepo {
	return &SentSet{
		Conn: tx,
	}
}

func (s *SentSet) Exists(ctx context.Context, setId int64) (bool, error) {
	const sql = `
		SELECT EXISTS
		(SELECT 1 FROM sent_sets WHERE set_id = $1)
	`
	var exists bool
	err := s.Conn.QueryRowContext(ctx, sql, setId).Scan(&exists)
	return exists, err
}

func (s *SentSet) Add(ctx context.Context, setId int64, tournamentPlatform string, messengerPlatform string, tournamentSlug string, state *entity.SetState, sentAtP1 *time.Time, sentAtP2 *time.Time) (int64, error) {
	const sql = `
		INSERT INTO sent_sets
			(set_id, tournament_platform, messenger_platform, tournament_slug, state, sent_at_p1, sent_at_p2)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (set_id, tournament_platform, messenger_platform)
		DO UPDATE SET
			state = COALESCE(EXCLUDED.state, sent_sets.state),
			sent_at_p1 = COALESCE(EXCLUDED.sent_at_p1, sent_sets.sent_at_p1),
			sent_at_p2 = COALESCE(EXCLUDED.sent_at_p2, sent_sets.sent_at_p2)
		RETURNING set_id`
	var id int64
	err := s.Conn.QueryRowContext(ctx, sql, setId, tournamentPlatform, messengerPlatform, tournamentSlug, state, sentAtP1, sentAtP2).Scan(&id)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return 0, nil
		}
		return 0, fmt.Errorf("unable to create sentSet in database, %w", err)
	}
	return id, nil
}

func (s *SentSet) Get(ctx context.Context, setId int64) (entity.SentSet, error) {
	const sql = `
		SELECT s.set_id, s.tournament_platform, s.messenger_platform, s.tournament_slug, s.state, s.sent_at_p1, s.sent_at_p2
		FROM sent_sets s
		WHERE set_id = $1`
	var sentSet entity.SentSet
	err := s.Conn.QueryRowContext(ctx, sql, setId).Scan(
		&sentSet.SetId,
		&sentSet.TournamentPlatform,
		&sentSet.MessengerPlatform,
		&sentSet.TournamentSlug,
		&sentSet.State,
		&sentSet.SentAtP1,
		&sentSet.SentAtP2,
	)
	if err != nil {
		return entity.SentSet{}, fmt.Errorf("unable to get sentSet in database, %w", err)
	}
	return sentSet, nil
}

func (s *SentSet) Del(ctx context.Context, setId int64) error {
	const sql = `
		DELETE FROM sent_sets
		WHERE set_id = $1`
	tag, err := s.Conn.ExecContext(ctx, sql, setId)
	if err != nil {
		return fmt.Errorf("don't deleted sentset from database, %w", err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("sentset doesn't exist")
	}

	return nil
}

func (s *SentSet) Edit(ctx context.Context, setId int64, tournamentPlatform string, messengerPlatform string, tournamentSlug string, state *entity.SetState, sent_at_p1 *time.Time, sent_at_p2 *time.Time) error {
	const sql = `
		UPDATE sent_sets
		SET tournament_platform = $2, messenger_platform = $3, tournament_slug = $4, state = $5, sent_at_p1 = $6, sent_at_p2 = $7
		WHERE set_id = $1`
	tag, err := s.Conn.ExecContext(ctx, sql, setId, tournamentPlatform, messengerPlatform, tournamentSlug, state, sent_at_p1, sent_at_p2)
	if err != nil {
		return fmt.Errorf("don't edited sentset from database, %w", err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("sentset doesn't exist")
	}

	return nil
}
