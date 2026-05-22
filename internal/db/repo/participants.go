package repo

import (
	"context"
	"fmt"

	"database/sql"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
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
		SELECT p.id, p.nickname, p.region, p.locale, p.updated_at
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
		SELECT p.id, p.nickname, p.region, p.locale, p.updated_at
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

func (p *Participants) TotalCount(ctx context.Context) (int, error) {
	const sql = `
		SELECT COUNT(id) FROM participants;
	`
	var id int
	err := p.Conn.QueryRowContext(ctx, sql).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to count participants in database, %w", err)
	}
	return id, nil
}

func (p *Participants) GetList(ctx context.Context, nameMessengerPlatform, nameTournamentPlatform, nameGame string, limit, offset int, search string) ([]entitySender.Participant, error) {
	const sql1 = `
		SELECT
			p.id,
			a_mess.platform_id as messenger_id,
			a_mess.platform_login as mess_nickname,
			a_tour.platform_login as tour_nickname,
			a_tour.platform_id as tourney_id,
			s.game_name,
			p.nickname,
			s.game_id,
			p.region,
			p.locale,
			s.rating,
			a_mess.is_found,
			s.updated_at as stats_updates_at,
			CASE 
				WHEN b.participant_id IS NOT NULL AND (b.expires_at IS NULL OR b.expires_at > DATETIME('now')) THEN 'banned'
				ELSE 'active'
			END as status,
			b.type_ban,
			b.reason,
			b.banned_at,
			b.expires_at
		FROM participants p
		LEFT JOIN participant_bans b ON p.id = b.participant_id
		LEFT JOIN participant_accounts a_mess ON p.id = a_mess.participant_id AND a_mess.platform_name = $1
		LEFT JOIN participant_accounts a_tour ON p.id = a_tour.participant_id AND a_tour.platform_name = $2
		LEFT JOIN participant_stats s ON p.id = s.participant_id AND s.game_name = $3
		WHERE 
			(
                s.game_name = $3 OR NOT EXISTS (SELECT 1 FROM participant_stats WHERE participant_id = p.id) OR $3 = '' OR $3 IS NULL
            )
			AND 
			(
				$6 IS NULL OR $6 = '' OR 
				LOWER(p.nickname) LIKE '%' || LOWER($6) || '%' OR
				LOWER(a_tour.platform_login) LIKE '%' || LOWER($6) || '%' OR 
				LOWER(a_mess.platform_login) LIKE '%' || LOWER($6) || '%' OR 
				LOWER(a_mess.platform_id) LIKE '%' || LOWER($6) || '%' OR 
				LOWER(s.game_id) LIKE '%' || LOWER($6) || '%' OR
				LOWER(p.region) LIKE '%' || LOWER($6) || '%'
			)
		ORDER BY p.id
		LIMIT $4 OFFSET $5
	`
	rows, err := p.Conn.QueryContext(ctx, sql1, nameMessengerPlatform, nameTournamentPlatform, nameGame, limit, offset, search)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	list := make([]entitySender.Participant, 0, limit)
	for rows.Next() {
		var row entitySender.Participant
		var (
			tempID                 int
			tempRegion             sql.NullString
			tempMessID             sql.NullString
			tempTourID             sql.NullString
			tempNicknameMessenger  sql.NullString
			tempNicknameTournament sql.NullString
			tempGameID             sql.NullString
			tempGameName           sql.NullString
			tempGameNickname       sql.NullString
			tempRating             sql.NullInt32
			tempIsFound            sql.NullBool
			tempUpdatedAt          sql.NullTime
			tempStatus             sql.NullString
			tempTypeBan            sql.NullString
			tempReason             sql.NullString
			tempBannedAt           sql.NullTime
			tempExpiresAt          sql.NullTime
		)
		err := rows.Scan(
			&tempID,
			&tempMessID,
			&tempNicknameMessenger,
			&tempNicknameTournament,
			&tempTourID,
			&tempGameName,
			&tempGameNickname,
			&tempGameID,
			&tempRegion,
			&row.Locale,
			&tempRating,
			&tempIsFound,
			&tempUpdatedAt,
			&tempStatus,
			&tempTypeBan,
			&tempReason,
			&tempBannedAt,
			&tempExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}

		row.Id = tempID
		row.MessenagerID = tempMessID.String
		row.MessenagerLogin = tempNicknameMessenger.String
		row.TournamentPlatformLogin = tempNicknameTournament.String
		row.TournamentPlatformID = tempTourID.String
		row.GameName = tempGameName.String
		row.GameNickname = tempGameNickname.String
		row.GameID = tempGameID.String
		row.Rating = int(tempRating.Int32)
		row.Region = tempRegion.String
		row.IsFound = tempMessID.Valid || tempNicknameTournament.Valid
		row.UpdatedAt = tempUpdatedAt.Time
		row.MessenagerName = nameMessengerPlatform
		row.TournamentPlatformName = nameTournamentPlatform
		row.IsBanned = tempStatus.String
		row.TypeBan = tempTypeBan.String
		row.Reason = tempReason.String
		if tempBannedAt.Valid {
			row.BannedAt = &tempBannedAt.Time
		} else {
			row.BannedAt = nil
		}

		if tempExpiresAt.Valid {
			row.ExpiresAt = &tempExpiresAt.Time
		} else {
			row.ExpiresAt = nil
		}

		list = append(list, row)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	return list, nil
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
