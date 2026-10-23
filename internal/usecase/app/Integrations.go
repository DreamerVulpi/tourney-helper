package application

import (
	"fmt"

	"os/exec"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/auth"
	loggerEntity "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entityMetrics "github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	entityPlatformRules "github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
	"github.com/dreamervulpi/tourney-helper/internal/entity/update"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckUpdate() (*update.UpdateInfo, error) {
	return a.UpdateService.Check(a.ctx)
}

func (a *App) IsNotificationSystemReady() bool {
	if a.ns == nil {
		return false
	}
	return a.ns.IsReady()
}

func (a *App) GetNotificationMetrics() entityMetrics.Snapshot {
	if a.ns == nil {
		return entityMetrics.Snapshot{}
	}
	return a.ns.GetMessengerMetrics()
}

func (a *App) GetGetDataMetrics() entityMetrics.Snapshot {
	if a.ns == nil {
		return entityMetrics.Snapshot{}
	}
	return a.ns.GetTournamentPlatformMetrics()
}

func (a *App) GetNotificationLimits() entityPlatformRules.Limits {
	if a.ns == nil {
		return entityPlatformRules.Limits{}
	}
	return a.ns.GetMessengerLimits()
}

func (a *App) GetMessengerMessageLimit() int64 {
	if a.ns == nil {
		return 0
	}
	return a.ns.GetMessengerMessageLimit()
}

func (a *App) GetTournamentPlatformLimits() entityPlatformRules.Limits {
	if a.ns == nil {
		return entityPlatformRules.Limits{}
	}
	return a.ns.GetTournamentPlatformLimits()
}

func (a *App) AuthorizeDiscord(clientID, clientSecret string, slotIndex int) error {
	if a.ActiveProfile == "" {
		return fmt.Errorf("no active profile")
	}
	if slotIndex < 0 || slotIndex >= config.SlotsPerPlatform {
		return fmt.Errorf("invalid slot index: %d", slotIndex)
	}

	if err := config.EnsureClientDir(a.ActiveProfile); err != nil {
		return fmt.Errorf("failed to ensure client dir: %w", err)
	}

	tokenPath := config.GetClientTokenPath(a.ActiveProfile, "discord", slotIndex)

	client := &auth.AuthClient{
		Config:         auth.GetDiscordOauth2(clientID, clientSecret),
		TokenFile:      tokenPath,
		CallbackPath:   "/discord/callback",
		CallbackServer: a.OAuthServer,
	}
	client.NamePlatform = "Discord"

	// 1. Пробуем загрузить существующий токен
	token, err := auth.GetTokenFromFile(client.TokenFile)
	if err == nil && token != nil && token.Valid() {
		client.Token = token
		client.HTTPClient = client.Config.Client(a.ctx, token)
		a.DeliveryMethodClient = client
		return nil
	}

	// 2. Если токена нет — начинаем OAuth
	authURL, codeChan, err := client.StartAuth(a.ctx)
	if err != nil {
		return fmt.Errorf("failed to start auth: %w", err)
	}
	redirectPath := "/discord/redirect"
	a.OAuthServer.RegisterRedirect(redirectPath, authURL)

	// 3. Запускаем горутину, которая дождется кода и сохранит токен
	go func() {
		if err := client.FinishAuth(a.ctx, codeChan); err != nil {
			logger.Log(loggerEntity.Error, fmt.Sprintf("Discord auth failed: %v", err))
			// Можно отправить событие на фронтенд, чтобы показать ошибку
			runtime.EventsEmit(a.ctx, "auth:error", err.Error())
			return
		}
		logger.Log(loggerEntity.Info, "Discord auth successful")
		// Отправляем событие об успехе, чтобы UI обновил статус слота
		runtime.EventsEmit(a.ctx, "auth:success", "discord", slotIndex)
	}()

	redirectURL := fmt.Sprintf("http://127.0.0.1:7310%s", redirectPath)
	return exec.Command("rundll32", "url.dll,FileProtocolHandler", redirectURL).Start()
}

func (a *App) AuthorizeStartgg(clientID, clientSecret string, slotIndex int) error {
	if a.ActiveProfile == "" {
		return fmt.Errorf("no active profile")
	}
	if slotIndex < 0 || slotIndex >= config.SlotsPerPlatform {
		return fmt.Errorf("invalid slot index: %d", slotIndex)
	}

	if err := config.EnsureClientDir(a.ActiveProfile); err != nil {
		return fmt.Errorf("failed to ensure client dir: %w", err)
	}

	tokenPath := config.GetClientTokenPath(a.ActiveProfile, "startgg", slotIndex)

	client := &auth.AuthClient{
		Config:         auth.GetStartggOauth2(clientID, clientSecret),
		TokenFile:      tokenPath,
		CallbackPath:   "/startgg/callback",
		CallbackServer: a.OAuthServer,
	}
	client.NamePlatform = "Startgg"

	// 1. Пробуем загрузить существующий токен
	token, err := auth.GetTokenFromFile(client.TokenFile)
	if err == nil && token != nil && token.Valid() {
		client.Token = token
		client.HTTPClient = client.Config.Client(a.ctx, token)
		a.TournamentClient = client
		return nil // Возвращаем пустой URL, так как авторизация не требуется
	}

	// 2. Если токена нет — начинаем OAuth
	authURL, codeChan, err := client.StartAuth(a.ctx)
	if err != nil {
		return fmt.Errorf("failed to start auth: %w", err)
	}
	redirectPath := "/startgg/redirect"
	a.OAuthServer.RegisterRedirect(redirectPath, authURL)

	// 3. Запускаем горутину, которая дождется кода и сохранит токен
	go func() {
		if err := client.FinishAuth(a.ctx, codeChan); err != nil {
			logger.Log(loggerEntity.Error, fmt.Sprintf("Startgg auth failed: %v", err))
			// Можно отправить событие на фронтенд, чтобы показать ошибку
			runtime.EventsEmit(a.ctx, "auth:error", err.Error())
			return
		}
		logger.Log(loggerEntity.Info, "Startgg auth successful")
		// Отправляем событие об успехе, чтобы UI обновил статус слота
		runtime.EventsEmit(a.ctx, "auth:success", "discord", slotIndex)
	}()

	redirectURL := fmt.Sprintf("http://127.0.0.1:7310%s", redirectPath)
	return exec.Command("rundll32", "url.dll,FileProtocolHandler", redirectURL).Start()
}
