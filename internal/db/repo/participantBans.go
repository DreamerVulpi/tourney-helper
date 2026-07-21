package repo

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourneyBot/internal/entity/sender"
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

func (p *ParticipantBans) Add(ctx context.Context, participantId int, typeBan string, reason string, expiresAt *time.Time) (int, error) {
	const sql = `INSERT INTO participant_bans (
		participant_id, type_ban, reason, banned_at, expires_at
	) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
		ON CONFLICT (participant_id) 
		DO UPDATE SET
			type_ban = EXCLUDED.type_ban,
			reason = CASE
				WHEN EXCLUDED.reason IS NULL
					OR EXCLUDED.reason = ''
				THEN participant_bans.reason
				ELSE EXCLUDED.reason
			END,
			banned_at = CURRENT_TIMESTAMP,
			expires_at = EXCLUDED.expires_at
		RETURNING id`
	var id int
	err := p.Conn.QueryRowContext(ctx, sql, participantId, typeBan, reason, expiresAt).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to ban participant (ID: %v) in database, %w", participantId, err)
	}
	return id, nil
}
func (p *ParticipantBans) Edit(ctx context.Context, participantId int, typeBan string, reason string, expiresAt *time.Time) error {
	const sql = `
		INSERT INTO participant_bans (participant_id, type_ban, reason, expires_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (participant_id)
		DO UPDATE SET type_ban = EXCLUDED.type_ban, reason = EXCLUDED.reason, expires_at = EXCLUDED.expires_at`
	_, err := p.Conn.ExecContext(ctx, sql, participantId, typeBan, reason, expiresAt)
	if err != nil {
		return fmt.Errorf("don't edited ban participant account (ID: %v) from database, %w", participantId, err)
	}

	return nil
}
func (p *ParticipantBans) Delete(ctx context.Context, participant_id int) error {
	const sql = `
		DELETE FROM participant_bans
		WHERE participant_id = $1`
	tag, err := p.Conn.ExecContext(ctx, sql, participant_id)
	if err != nil {
		return fmt.Errorf("don't deleted ban (ID: %v) from database, %w", participant_id, err)
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

func (p *ParticipantBans) DeleteExpired(ctx context.Context) error {
	now := time.Now()
	const sql = `
		DELETE FROM participant_bans WHERE expires_at < $1
	`
	_, err := p.Conn.ExecContext(ctx, sql, now)
	if err != nil {
		return err
	}
	return nil
}

func (p *ParticipantBans) Get(ctx context.Context, id int) (entity.ParticipantBans, error) {
	const sql = `
		SELECT pb.id, pb.participant_id, pb.type_ban, pb.reason, pb.banned_at, pb.expires_at
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

func (p *ParticipantBans) TotalCount(ctx context.Context) (int, error) {
	const sql = `
		SELECT COUNT(id) FROM participant_bans;
	`
	var id int
	err := p.Conn.QueryRowContext(ctx, sql).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to count banned participants in database, %w", err)
	}
	return id, nil
}

func (p *ParticipantBans) GetList(ctx context.Context, nameMessenger string, nameTournamentPlatform string, nameGame string, limit, offset int, search string) ([]entitySender.Participant, error) {
	const sql1 = `
		SELECT
			p.id,
			a_mess.platform_id as messenger_id,
			a_mess.platform_login as mess_nickname,
			a_mess.platform_name as mess_platform,
			a_tour.platform_name as tour_platform,
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
		INNER JOIN participant_bans b ON p.id = b.participant_id
		LEFT JOIN participant_accounts a_mess ON p.id = a_mess.participant_id AND a_mess.platform_name = $1
		LEFT JOIN participant_accounts a_tour ON p.id = a_tour.participant_id AND a_tour.platform_name = $2
		LEFT JOIN participant_stats s ON p.id = s.participant_id AND s.game_name = $3
		WHERE 
		(
			b.expires_at IS NULL
			OR b.expires_at > DATETIME('now')
		) AND
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
		LIMIT $4 OFFSET $5`

	rows, err := p.Conn.QueryContext(ctx, sql1, nameMessenger, nameTournamentPlatform, nameGame, limit, offset, search)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	list := make([]entitySender.Participant, 0, limit)
	for rows.Next() {
		var row entitySender.Participant
		var (
			tempID                  int
			tempRegion              sql.NullString
			tempMessID              sql.NullString
			tempTourID              sql.NullString
			tempNicknameMessenger   sql.NullString
			tempMessengerName       sql.NullString
			tempTourneyPlatformName sql.NullString
			tempNicknameTournament  sql.NullString
			tempGameID              sql.NullString
			tempGameName            sql.NullString
			tempGameNickname        sql.NullString
			tempRating              sql.NullInt32
			tempIsFound             sql.NullBool
			tempUpdatedAt           sql.NullTime
			tempStatus              sql.NullString
			tempTypeBan             sql.NullString
			tempReason              sql.NullString
			tempBannedAt            sql.NullTime
			tempExpiresAt           sql.NullTime
		)
		err := rows.Scan(
			&tempID,
			&tempMessID,
			&tempNicknameMessenger,
			&tempMessengerName,
			&tempTourneyPlatformName,
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
		row.MessengerID = tempMessID.String
		row.MessengerLogin = tempNicknameMessenger.String
		row.TournamentPlatformLogin = tempNicknameTournament.String
		row.TournamentPlatformID = tempTourID.String
		row.GameName = tempGameName.String
		row.GameNickname = tempGameNickname.String
		row.GameID = tempGameID.String
		row.Rating = int(tempRating.Int32)
		row.Region = tempRegion.String
		row.IsFound = tempMessID.Valid || tempNicknameTournament.Valid
		row.UpdatedAt = tempUpdatedAt.Time
		row.MessengerName = tempMessengerName.String
		row.TournamentPlatformName = tempTourneyPlatformName.String
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
