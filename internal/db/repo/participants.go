package repo

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type Participants struct {
	Conn *sql.DB
}

func (p *Participants) Add(gamerTag string, messenagerPlatform string, messenagerPlatformId string, messenagerPlatformLogin string, updatedAt time.Time, isFound bool, locale string) (string, string, error) {
	const sql = `
		INSERT INTO participants (
			gamer_tag, platform, platform_id, platform_login, updated_at, is_found, locale
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (gamer_tag, platform) 
		DO UPDATE SET 
			platform_id = EXCLUDED.platform_id,
			platform_login = EXCLUDED.platform_login,
			updated_at = EXCLUDED.updated_at,
			locale = EXCLUDED.locale,
			is_found = EXCLUDED.is_found
		RETURNING gamer_tag, platform`
	var resGamerTag, resMessenagerPlatform string
	err := p.Conn.QueryRowContext(context.Background(), sql, gamerTag, messenagerPlatform, messenagerPlatformId, messenagerPlatformLogin, updatedAt, isFound, locale).Scan(&resGamerTag, &resMessenagerPlatform)
	if err != nil {
		return "", "", fmt.Errorf("unable to create participants in database, %w", err)
	}
	return resGamerTag, resMessenagerPlatform, nil
}

func (p *Participants) Edit(gamerTag string, messenagerPlatform string, messenagerPlatformId string, messenagerPlatformLogin string, updatedAt time.Time, isFound bool, locale string) error {
	const sql = `
		UPDATE participants
		SET platform_id = $3, platform_login = $4, updated_at = $5, is_found = $6, locale = $7
		WHERE gamer_tag = $1 AND platform = $2`

	tag, err := p.Conn.ExecContext(context.Background(), sql, gamerTag, messenagerPlatform, messenagerPlatformId, messenagerPlatformLogin, updatedAt, locale)
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

func (p *Participants) Get(gamerTag, messenagerPlatform string) (entity.Participant, error) {
	const sql = `
		SELECT p.gamer_tag, p.platform, p.platform_id, p.platform_login, p.updated_at, p.is_found, p.locale
		FROM participants p
		WHERE gamer_tag = $1 AND platform = $2`

	var participant entity.Participant
	err := p.Conn.QueryRowContext(context.Background(), sql, gamerTag, messenagerPlatform).Scan(
		&participant.GamerTag,
		&participant.MessengerPlatform,
		&participant.MessengerPlatformId,
		&participant.MessengerPlatformLogin,
		&participant.UpdatedAt,
		&participant.IsFound,
		&participant.Locale,
	)
	if err != nil {
		return entity.Participant{}, fmt.Errorf("unable to find participant in database, %w", err)
	}
	return participant, nil
}

func (p *Participants) Del(gamerTag, platform string) error {
	const sql = `
		DELETE FROM participants
		WHERE gamer_tag = $1 AND platform = $2`
	tag, err := p.Conn.ExecContext(context.Background(), sql, gamerTag, platform)
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
