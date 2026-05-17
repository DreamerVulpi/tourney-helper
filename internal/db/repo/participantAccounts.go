package repo

import (
	"context"
	"fmt"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantAccounts struct {
	Conn entity.SQLHandler
}

// Change type connection from usual to transaction
func (p *ParticipantAccounts) WithTx(tx entity.SQLHandler) entity.ParticipantAccountsRepo {
	return &ParticipantAccounts{
		Conn: tx,
	}
}

func (p *ParticipantAccounts) Add(ctx context.Context, participantId int, platformName string, platformId string, platformLogin string, isFound bool) (int, error) {
	const sql = `
		INSERT INTO participant_accounts (
			participant_id, platform_name, platform_id, platform_login, is_found
		)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (platform_name, platform_id, participant_id) 
		DO UPDATE SET
			platform_login = EXCLUDED.platform_login,
			is_found = EXCLUDED.is_found,
			updated_at = CURRENT_TIMESTAMP 
		RETURNING id`
	var id int
	err := p.Conn.QueryRowContext(ctx, sql, participantId, platformName, platformId, platformLogin, isFound).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("unable to create participant account (%v - %v) in database, %w", platformName, platformLogin, err)
	}
	return id, nil
}

func (p *ParticipantAccounts) Edit(ctx context.Context, participantId int, platformName string, platformId string, platformLogin string, isFound bool) error {
	const sql = `
		UPDATE participant_accounts 
		SET platform_id = $3, platform_login = $4, is_found = $5, updated_at = CURRENT_TIMESTAMP
		WHERE participant_id = $1 AND platform_name = $2`

	tag, err := p.Conn.ExecContext(ctx, sql, participantId, platformName, platformId, platformLogin, isFound)
	if err != nil {
		return fmt.Errorf("don't edited participant account (PlatformName: %v) from database, %w", platformName, err)
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

func (p *ParticipantAccounts) GetById(ctx context.Context, id int) ([]entity.ParticipantAccount, error) {
	const sql = `
		SELECT pa.id, pa.platform_name, pa.participant_id, pa.platform_login, pa.platform_id, pa.is_found, pa.updated_at
		FROM participant_accounts pa
		WHERE participant_id = $1`
	rows, err := p.Conn.QueryContext(ctx, sql, id)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	var accounts []entity.ParticipantAccount
	for rows.Next() {
		var pa entity.ParticipantAccount
		err := rows.Scan(
			&pa.Id,
			&pa.PlatformName,
			&pa.ParticipantId,
			&pa.PlatformLogin,
			&pa.PlatformId,
			&pa.IsFound,
			&pa.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}
		accounts = append(accounts, pa)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return accounts, nil
}

func (p *ParticipantAccounts) GetByPlatform(ctx context.Context, platformName string, platformId string) (entity.ParticipantAccount, error) {
	const sql = `
		SELECT pa.id, pa.platform_name, pa.participant_id, pa.platform_login, pa.platform_id, pa.is_found, pa.updated_at
		FROM participant_accounts pa
		WHERE platform_name = $1 AND platform_id = $2`
	var account entity.ParticipantAccount
	err := p.Conn.QueryRowContext(ctx, sql, platformName, platformId).Scan(
		&account.Id,
		&account.PlatformName,
		&account.ParticipantId,
		&account.PlatformLogin,
		&account.PlatformId,
		&account.IsFound,
		&account.UpdatedAt,
	)
	if err != nil {
		return entity.ParticipantAccount{}, fmt.Errorf("unable to find account %v of participant in database using ID: %v | %w", platformName, platformId, err)
	}
	return account, nil
}

func (p *ParticipantAccounts) DelByPlatform(ctx context.Context, participantId int, platformName string, platformId string) error {
	const sql = `
		DELETE FROM participant_accounts
		WHERE participant_id = $1 AND platform_name = $2 AND platform_id = $3`
	tag, err := p.Conn.ExecContext(ctx, sql, participantId, platformName, platformId)
	if err != nil {
		return fmt.Errorf("don't deleted account %v of participant (ID: %v) from database, %w", platformName, participantId, err)
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
