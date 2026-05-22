package repo

import (
	"context"
	"fmt"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantStats struct {
	Conn entity.SQLHandler
}

// Change type connection from usual to transaction
func (p *ParticipantStats) WithTx(tx entity.SQLHandler) entity.ParticipantStatsRepo {
	return &ParticipantStats{
		Conn: tx,
	}
}

func (p *ParticipantStats) Add(ctx context.Context, participantId int, gameName string, gameId string, rating int) (int, error) {
	const sql = `
		INSERT INTO participant_stats (
			participant_id, game_name, game_id, rating
		)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (participant_id, game_name) 
		DO UPDATE SET
			game_id = EXCLUDED.game_id,
			rating = EXCLUDED.rating,
			updated_at = CURRENT_TIMESTAMP 
		RETURNING id
	`
	var id int
	err := p.Conn.QueryRowContext(ctx, sql, participantId, gameName, gameId, rating).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to create stats for participant (ID: %v) in database, %w", participantId, err)
	}
	return id, nil
}

func (p *ParticipantStats) Edit(ctx context.Context, participantId int, gameName string, gameId string, rating int) error {
	const sql = `
		INSERT INTO participant_stats (
			participant_id, game_name, game_id, rating
		)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (game_name, participant_id)
		DO UPDATE SET
			game_id = EXCLUDED.game_id,
			rating = EXCLUDED.rating,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id`
	_, err := p.Conn.ExecContext(ctx, sql, participantId, gameName, gameId, rating)
	if err != nil {
		return fmt.Errorf("don't edited participantStats from database, %w", err)
	}
	return nil
}

func (p *ParticipantStats) EditRating(ctx context.Context, participantId, rating int) error {
	const sql = `
		UPDATE participant_stats
		SET rating = $2, updated_at = CURRENT_TIMESTAMP
		WHERE participant_id = $1`
	tag, err := p.Conn.ExecContext(ctx, sql, participantId, rating)
	if err != nil {
		return fmt.Errorf("don't edited rating from database, %w", err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("participant stats (ID: %v) doesn't exist", participantId)
	}
	return nil
}

func (p *ParticipantStats) DelByGame(ctx context.Context, participantId int, gameName string) error {
	const sql = `
		DELETE FROM participant_stats
		WHERE participant_id = $1 AND LOWER(game_name) = LOWER($2)
	`
	tag, err := p.Conn.ExecContext(ctx, sql, participantId, gameName)
	if err != nil {
		return fmt.Errorf("don't deleted stats game %v of participant (ID: %v) from database, %w", gameName, participantId, err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("stats (Game: %v) doesn't exist for participant (ID: %v)", gameName, participantId)
	}
	return nil
}

func (p *ParticipantStats) GetById(ctx context.Context, participantId int) ([]entity.ParticipantStat, error) {
	const sql = `
		SELECT ps.id, ps.participant_id, ps.game_name, ps.game_id, ps.rating, ps.updated_at
		FROM participant_stats ps
		WHERE participant_id = $1`
	rows, err := p.Conn.QueryContext(ctx, sql, participantId)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	var stats []entity.ParticipantStat
	for rows.Next() {
		var ps entity.ParticipantStat
		err := rows.Scan(
			&ps.Id,
			&ps.ParticipantId,
			&ps.GameName,
			&ps.GameId,
			&ps.Rating,
			&ps.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}
		stats = append(stats, ps)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	return stats, nil
}

func (p *ParticipantStats) GetByGame(ctx context.Context, participantId int, gameName string) (entity.ParticipantStat, error) {
	const sql = `
		SELECT ps.id, ps.participant_id, ps.game_name, ps.game_id, ps.rating, updated_at
		FROM participant_stats ps
		WHERE participant_id = $1 AND LOWER(game_name) = LOWER($2)
	`
	var stat entity.ParticipantStat
	err := p.Conn.QueryRowContext(ctx, sql, participantId, gameName).Scan(
		&stat.Id,
		&stat.ParticipantId,
		&stat.GameName,
		&stat.GameId,
		&stat.Rating,
		&stat.UpdatedAt,
	)
	if err != nil {
		return entity.ParticipantStat{}, fmt.Errorf("unable to find participant in database using ID: %v | %w", participantId, err)
	}
	return stat, nil
}

func (p *ParticipantStats) ResetRaiting(ctx context.Context, gameName string) error {
	const sql = `
		UPDATE participant_stats
		SET rating = 0
		WHERE LOWER(game_name) = LOWER($1)
	`
	tag, err := p.Conn.ExecContext(ctx, sql, gameName)
	if err != nil {
		return fmt.Errorf("don't reset stats game %v from database, %w", gameName, err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("stats (Game: %v) doesn't exist ", gameName)
	}
	return nil
}
