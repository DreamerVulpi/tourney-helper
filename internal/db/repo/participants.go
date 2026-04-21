package repo

import (
	"context"
	"database/sql"
	"fmt"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type Participants struct {
	Conn *sql.DB
}

func (p *Participants) Add(nickname string, region string, locale string) (int, error) {
	const sql = `
		INSERT INTO participants (
			nickname, region, locale, updated_at
		)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (nickname) 
		DO UPDATE SET
			nickname = EXCLUDED.nickname,
			region = EXCLUDED.region,
			locale = EXCLUDED.locale,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id`
	var id int
	err := p.Conn.QueryRowContext(context.Background(), sql, nickname, region, locale).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to create participant in database, %w", err)
	}
	return id, nil
}

func (p *Participants) Edit(id int, nickname string, region string, locale string) error {
	const sql = `
		UPDATE participants
		SET nickname = $2, region = $3, locale = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	tag, err := p.Conn.ExecContext(context.Background(), sql, id, nickname, region, locale)
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

func (p *Participants) GetById(id int) (entity.Participant, error) {
	const sql = `
		SELECT p.id, p.nickname, p.region, p.locale, p.update_at
		FROM participants p
		WHERE id = $1`

	var participant entity.Participant
	err := p.Conn.QueryRowContext(context.Background(), sql, id).Scan(
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

func (p *Participants) GetByNickname(nickname string) (entity.Participant, error) {
	const sql = `
		SELECT p.id, p.nickname, p.region, p.locale, p.update_at
		FROM participants p
		WHERE nickname = $1`

	var participant entity.Participant
	err := p.Conn.QueryRowContext(context.Background(), sql, nickname).Scan(
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

func (p *Participants) Del(id int) error {
	const sql = `
		DELETE FROM participants
		WHERE id = $1`
	tag, err := p.Conn.ExecContext(context.Background(), sql, id)
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
