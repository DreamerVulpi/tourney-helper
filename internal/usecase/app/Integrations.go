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
	"golang.org/x/oauth2"
)

// platformSpec описывает различия между платформами.
type platformSpec struct {
	ID           string // "discord" / "startgg"
	DisplayName  string // "Discord" / "Startgg"
	CallbackPath string // "/discord/callback"
	RedirectPath string // "/discord/redirect"
	OAuthConfig  func(clientID, clientSecret string) *oauth2.Config
	AssignClient func(a *App, client *auth.AuthClient) // куда положить готовый клиент
}

var platformSpecs = map[string]platformSpec{
	"discord": {
		ID:           "discord",
		DisplayName:  "Discord",
		CallbackPath: "/discord/callback",
		RedirectPath: "/discord/redirect",
		OAuthConfig:  auth.GetDiscordOauth2,
		AssignClient: func(a *App, c *auth.AuthClient) { a.DeliveryMethodClient = c },
	},
	"startgg": {
		ID:           "startgg",
		DisplayName:  "Startgg",
		CallbackPath: "/startgg/callback",
		RedirectPath: "/startgg/redirect",
		OAuthConfig:  auth.GetStartggOauth2,
		AssignClient: func(a *App, c *auth.AuthClient) { a.TournamentClient = c },
	},
}

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

func (a *App) authorizeError(specID string, slotIndex int, typeErr string, err error) error {
	reason := ""
	if err != nil {
		reason = err.Error()
	}

	if statusErr := a.SetSlotStatus(specID, slotIndex, config.AuthStatusUnauthorized, reason); statusErr != nil {
		logger.Log(loggerEntity.Warning,
			fmt.Sprintf("failed to set unauthorized status for %s[%d]: %v", specID, slotIndex, statusErr))
	}

	runtime.EventsEmit(a.ctx, "auth:error", specID, slotIndex, reason)

	if err != nil {
		logger.Log(loggerEntity.Error,
			fmt.Sprintf("%s auth failed [%s]: %v", specID, typeErr, err))
	}

	if err == nil {
		return fmt.Errorf("%s auth failed [%s]", specID, typeErr)
	}
	return fmt.Errorf("%s auth failed [%s]: %w", specID, typeErr, err)
}

func (a *App) authorizeSuccess(specID string, slotIndex int) {
	if err := a.SetSlotStatus(specID, slotIndex, config.AuthStatusAuthorized, ""); err != nil {
		logger.Log(loggerEntity.Warning,
			fmt.Sprintf("failed to set authorized status for %s[%d]: %v", specID, slotIndex, err))
	}
	runtime.EventsEmit(a.ctx, "auth:success", specID, slotIndex)
}

func (a *App) authorizePlatform(platformID, clientID, clientSecret string, slotIndex int) error {
	spec, ok := platformSpecs[platformID]
	if !ok {
		return fmt.Errorf("unknown platform: %s", platformID)
	}

	if a.ActiveProfile == "" {
		return fmt.Errorf("no active profile")
	}
	if slotIndex < 0 || slotIndex >= config.SlotsPerPlatform {
		return fmt.Errorf("invalid slot index: %d", slotIndex)
	}
	if err := config.EnsureClientDir(a.ActiveProfile); err != nil {
		return fmt.Errorf("failed to ensure client dir: %w", err)
	}

	if err := a.SetSlotStatus(spec.ID, slotIndex, config.AuthStatusPending, ""); err != nil {
		logger.Log(loggerEntity.Warning, "failed to set pending status: "+err.Error())
	}
	runtime.EventsEmit(a.ctx, "auth:pending", spec.ID, slotIndex)

	tokenPath := config.GetClientTokenPath(a.ActiveProfile, spec.ID, slotIndex)
	client := &auth.AuthClient{
		Config:         spec.OAuthConfig(clientID, clientSecret),
		TokenFile:      tokenPath,
		CallbackPath:   spec.CallbackPath,
		CallbackServer: a.OAuthServer,
	}
	client.NamePlatform = spec.DisplayName

	if token, err := auth.GetTokenFromFile(client.TokenFile); err == nil && token != nil && token.Valid() {
		client.Token = token
		client.HTTPClient = client.Config.Client(a.ctx, token)
		spec.AssignClient(a, client)

		a.authorizeSuccess(spec.ID, slotIndex)
		return nil
	}

	authURL, codeChan, err := client.StartAuth(a.ctx)
	if err != nil {
		return a.authorizeError(spec.ID, slotIndex, "start_auth", err)
	}
	a.OAuthServer.RegisterRedirect(spec.RedirectPath, authURL)

	go func() {
		if err := client.FinishAuth(a.ctx, codeChan); err != nil {
			_ = a.authorizeError(spec.ID, slotIndex, "finish_auth", err)
			return
		}
		logger.Log(loggerEntity.Info, spec.DisplayName+" auth successful")
		a.authorizeSuccess(spec.ID, slotIndex)
	}()

	redirectURL := fmt.Sprintf("http://127.0.0.1:7310%s", spec.RedirectPath)
	if err := exec.Command("rundll32", "url.dll,FileProtocolHandler", redirectURL).Start(); err != nil {
		return a.authorizeError(spec.ID, slotIndex, "launch_browser", err)
	}

	return nil
}

func (a *App) AuthorizeDiscord(clientID, clientSecret string, slotIndex int) error {
	return a.authorizePlatform("discord", clientID, clientSecret, slotIndex)
}

func (a *App) AuthorizeStartgg(clientID, clientSecret string, slotIndex int) error {
	return a.authorizePlatform("startgg", clientID, clientSecret, slotIndex)
}
