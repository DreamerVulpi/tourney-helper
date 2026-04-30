package repo

import (
	"context"
	"fmt"
	"time"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantBans struct {
	Conn entity.SQLHandler
}

// Change type connection from usual to transaction
func (p *ParticipantBans) WithTx(tx entity.SQLHandler) entity.ParticipantBansRepo {
	return &ParticipantBans{
		Conn: tx,
	}
}

func (p *ParticipantBans) Add(ctx context.Context, participantId int, typeBan string, reason string, bannedAt time.Time, expiresAt *time.Time) (int, error) {
	const sql = `INSERT INTO participant_bans (
		participant_id, type_ban, reason, banned_at, expires_at
	) VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (participant_id) 
		DO UPDATE SET
			type_ban = EXCLUDED.type_ban,
			reason = EXCLUDED.reason,
			banned_at = CURRENT_TIMESTAMP,
			expires_at = EXCLUDED.expires_at
		RETURNING id`
	var id int
	err := p.Conn.QueryRowContext(ctx, sql, participantId, typeBan, reason, bannedAt, expiresAt).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to ban participant (ID: %v) in database, %w", participantId, err)
	}
	return id, nil
}
func (p *ParticipantBans) Edit(ctx context.Context, id int, participantId int, typeBan string, reason string, bannedAt time.Time, expiresAt *time.Time) error {
	const sql = `
		UPDATE participant_bans
		SET participant_id = $2, type_ban = $3, reason = $4, bannedAt = $5, expiresAt = $6
		WHERE id = $1`
	tag, err := p.Conn.ExecContext(ctx, sql, id, participantId, participantId, typeBan, reason, bannedAt, expiresAt)
	if err != nil {
		return fmt.Errorf("don't edited ban participant account (ID: %v) from database, %w", participantId, err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("ban doesn't exist")
	}

	return nil
}
func (p *ParticipantBans) Delete(ctx context.Context, id int) error {
	const sql = `
		DELETE FROM participant_bans
		WHERE id = $1`
	tag, err := p.Conn.ExecContext(ctx, sql, id)
	if err != nil {
		return fmt.Errorf("don't deleted ban (ID: %v) from database, %w", id, err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("ban doesn't exist")
	}

	return nil
}
func (p *ParticipantBans) Get(ctx context.Context, id int) (entity.ParticipantBans, error) {
	const sql = `
		SELECT pb.id, pb_participant_id, pb.type_ban, pb.reason, pb.banned_at, pb.expires_at
		FROM participant_bans pb
		WHERE id = $1
	`
	var ban entity.ParticipantBans
	err := p.Conn.QueryRowContext(ctx, sql, id).Scan(
		&ban.Id,
		&ban.ParticipantId,
		&ban.TypeBan,
		&ban.Reason,
		&ban.BannedAt,
		&ban.ExpiresAt,
	)
	if err != nil {
		return entity.ParticipantBans{}, fmt.Errorf("unable to find ban in database using ID: %v | %w", id, err)
	}
	return ban, nil
}

func (p *ParticipantBans) IsBanned(ctx context.Context, participantId int) (bool, error) {
	const sql = `
		SELECT EXISTS(
			SELECT 1 FROM participant_bans
			WHERE participant_id = $1
			AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
		)`
	var isBanned bool
	err := p.Conn.QueryRowContext(ctx, sql, participantId).Scan(&isBanned)
	return isBanned, err
}
