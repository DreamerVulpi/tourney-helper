package repo

import (
	"context"
	"fmt"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type Participants struct {
	Conn entity.SQLHandler
}

// Change type connection from usual to transaction
func (p *Participants) WithTx(tx entity.SQLHandler) entity.ParticipantRepo {
	return &Participants{
		Conn: tx,
	}
}

func (p *Participants) Add(ctx context.Context, nickname string, region string, locale string) (int, error) {
	const sql = `
		INSERT INTO participants (
			nickname, region, locale
		)
		VALUES ($1, $2, $3)
		ON CONFLICT (nickname) 
		DO UPDATE SET
			nickname = EXCLUDED.nickname,
			region = EXCLUDED.region,
			locale = EXCLUDED.locale,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id`
	var id int
	err := p.Conn.QueryRowContext(ctx, sql, nickname, region, locale).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to create participant in database, %w", err)
	}
	return id, nil
}

func (p *Participants) Edit(ctx context.Context, id int, nickname string, region string, locale string) error {
	const sql = `
		UPDATE participants
		SET nickname = $2, region = $3, locale = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	tag, err := p.Conn.ExecContext(ctx, sql, id, nickname, region, locale)
	if err != nil {
		return fmt.Errorf("don't edited participant from database, %w", err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("participant doesn't exist")
	}

	return nil
}

func (p *Participants) GetById(ctx context.Context, id int) (entity.Participant, error) {
	const sql = `
		SELECT p.id, p.nickname, p.region, p.locale, p.update_at
		FROM participants p
		WHERE id = $1`

	var participant entity.Participant
	err := p.Conn.QueryRowContext(ctx, sql, id).Scan(
		&participant.Id,
		&participant.Nickname,
		&participant.Region,
		&participant.Locale,
		&participant.UpdatedAt,
	)
	if err != nil {
		return entity.Participant{}, fmt.Errorf("unable to find participant in database using ID: %v | %w", id, err)
	}
	return participant, nil
}

func (p *Participants) GetByNickname(ctx context.Context, nickname string) (entity.Participant, error) {
	const sql = `
		SELECT p.id, p.nickname, p.region, p.locale, p.update_at
		FROM participants p
		WHERE nickname = $1`

	var participant entity.Participant
	err := p.Conn.QueryRowContext(ctx, sql, nickname).Scan(
		&participant.Id,
		&participant.Nickname,
		&participant.Region,
		&participant.Locale,
		&participant.UpdatedAt,
	)
	if err != nil {
		return entity.Participant{}, fmt.Errorf("unable to find participant in database using nickname: %v | %w", nickname, err)
	}
	return participant, nil
}

func (p *Participants) Del(ctx context.Context, id int) error {
	const sql = `
		DELETE FROM participants
		WHERE id = $1`
	tag, err := p.Conn.ExecContext(ctx, sql, id)
	if err != nil {
		return fmt.Errorf("don't deleted participant from database, %w", err)
	}

	rows, err := tag.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("participant doesn't exist")
	}

	return nil
}
