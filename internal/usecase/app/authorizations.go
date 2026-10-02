package application

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func (a *App) checkStartggSlot(ctx context.Context, slot config.ClientCredentials, index int) config.AuthStatus {
	if slot.ClientID == "" || slot.SecretClient == "" {
		return config.AuthStatusUnauthorized
	}

	tokenPath := config.GetClientTokenPath(a.ActiveProfile, "startgg", index)

	client := &auth.AuthClient{
		Config:         auth.GetStartggOauth2(slot.ClientID, slot.SecretClient),
		TokenFile:      tokenPath,
		CallbackPath:   "/startgg/callback",
		CallbackServer: a.OAuthServer,
	}

	if err := client.TryRestore(ctx); err != nil {
		if errors.Is(err, auth.ErrTokenMissing) {
			return config.AuthStatusUnauthorized
		}
		logger.Log(entityLogger.Warning,
			fmt.Sprintf("startgg slot #%d restore failed: %v", index+1, err))
		return config.AuthStatusExpired
	}

	return config.AuthStatusAuthorized
}

func (a *App) checkChallongeSlot(ctx context.Context, slot config.ClientCredentials, index int) config.AuthStatus {
	return config.AuthStatusUnauthorized
}

func (a *App) checkDiscordSlot(ctx context.Context, slot config.ClientCredentials, index int) config.AuthStatus {
	if slot.ClientID == "" || slot.SecretClient == "" {
		return config.AuthStatusUnauthorized
	}

	tokenPath := config.GetClientTokenPath(a.ActiveProfile, "discord", index)

	client := &auth.AuthClient{
		Config:         auth.GetDiscordOauth2(slot.ClientID, slot.SecretClient),
		TokenFile:      tokenPath,
		CallbackPath:   "/discord/callback",
		CallbackServer: a.OAuthServer,
	}

	if err := client.TryRestore(ctx); err != nil {
		if errors.Is(err, auth.ErrTokenMissing) {
			return config.AuthStatusUnauthorized
		}
		logger.Log(entityLogger.Warning,
			fmt.Sprintf("discord slot #%d restore failed: %v", index+1, err))
		return config.AuthStatusExpired
	}

	return config.AuthStatusAuthorized
}

func (a *App) checkTelegramSlot(ctx context.Context, slot config.ClientCredentials, index int) config.AuthStatus {
	if slot.Token == "" {
		return config.AuthStatusUnauthorized
	}

	// Telegram Bot API: getMe
	url := fmt.Sprintf("https://api.telegram.org/bot%s/getMe", slot.Token)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return config.AuthStatusError
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return config.AuthStatusError
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		return config.AuthStatusAuthorized
	case http.StatusUnauthorized:
		return config.AuthStatusExpired
	default:
		return config.AuthStatusError
	}
}

// DeleteClientToken — delete file token for selected slot
// platformID: "startgg" | "challonge" | "discord" | "telegram"
func (a *App) DeleteClientToken(platformID string, slotIndex int) error {
	if a.ActiveProfile == "" {
		return fmt.Errorf("no active profile")
	}
	if slotIndex < 0 || slotIndex >= config.SlotsPerPlatform {
		return fmt.Errorf("invalid slot index: %d", slotIndex)
	}

	// Проверяем, что platformID известен
	switch platformID {
	case "startgg", "challonge", "discord", "telegram":
		// ok
	default:
		return fmt.Errorf("unknown platform: %s", platformID)
	}

	if err := config.DeleteClientToken(a.ActiveProfile, platformID, slotIndex); err != nil {
		return fmt.Errorf("delete client token: %w", err)
	}

	logger.Log(entityLogger.Info, fmt.Sprintf(
		"[DeleteClientToken] removed %s slot #%d for profile %q",
		platformID, slotIndex+1, a.ActiveProfile,
	))
	return nil
}
