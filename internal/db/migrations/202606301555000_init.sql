-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'N/D',
    locale TEXT NOT NULL DEFAULT 'en',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nickname)
);

CREATE TABLE IF NOT EXISTS participant_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    game_name TEXT NOT NULL, -- Tekken 8, SF6 and etc.
    game_id TEXT NOT NULL, -- Internal ID
    rating INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(participant_id, game_name) -- One player = 1 note stats for 1 game
);

CREATE TABLE IF NOT EXISTS participant_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    platform_name TEXT NOT NULL, -- discord, tg, startgg, challonge
    platform_id TEXT NOT NULL,
    dm_channel_id TEXT DEFAULT NULL,
    platform_login TEXT NOT NULL,
    is_found BOOLEAN NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(platform_name, participant_id)
);

CREATE TABLE IF NOT EXISTS participant_bans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    type_ban TEXT NOT NULL,
    reason TEXT NOT NULL,
    banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(participant_id)
);

CREATE TABLE IF NOT EXISTS sent_sets (
    set_id INTEGER NOT NULL,
    tournament_platform TEXT NOT NULL,
    messenger_platform TEXT NOT NULL,
    tournament_slug TEXT NOT NULL,
    state INTEGER NOT NULL,
    sent_at_p1 DATETIME,
    sent_at_p2 DATETIME,
    UNIQUE(set_id, tournament_platform, messenger_platform)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS participant_stats;
DROP TABLE IF EXISTS participant_accounts;
DROP TABLE IF EXISTS participant_bans;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS sent_sets;
-- +goose StatementEnd