package auth

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"net/http"

	"fmt"

	loggerEntity "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

const (
	Addr              = "127.0.0.1:7310"
	startggAuthURL    = "https://start.gg/oauth/authorize"
	startggTokenURL   = "https://api.start.gg/oauth/access_token"
	discordAuthURL    = "https://discord.com/api/oauth2/authorize"
	discordTokenURL   = "https://discord.com/api/oauth2/token"
	challongeAuthURL  = "https://api.challonge.com/oauth/authorize"
	challongeTokenURL = "https://api.challonge.com/oauth/token"
	challongeUserURL  = "https://api.challonge.com/v2/me.json"
)

var ErrTokenNotFound = errors.New("token file not found")
var ErrTokenMissing = errors.New("token file missing")

type Identity struct {
	ID          string
	Username    string
	Platform    string
	RawResponse map[string]interface{}
}

type AuthClient struct {
	NamePlatform   string
	Config         *oauth2.Config
	HTTPClient     *http.Client
	Token          *oauth2.Token
	TokenFile      string
	CallbackPath   string
	CallbackServer *OAuthCallbackServer
}

func GetStartggOauth2(clientID, clientSecret string) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://127.0.0.1:7310/startgg/callback",
		Endpoint: oauth2.Endpoint{
			AuthURL:  startggAuthURL,
			TokenURL: startggTokenURL,
		},
		Scopes: []string{"user.identity", "tournament.reporter"},
	}
}

func (a *AuthClient) GetAccessToken(filename string) (string, error) {
	token, err := GetTokenFromFile(filename)
	if err != nil {
		return "", err
	}
	return token.AccessToken, nil
}

func GetDiscordOauth2(clientID, clientSecret string) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://127.0.0.1:7310/discord/callback",
		Endpoint: oauth2.Endpoint{
			AuthURL:  discordAuthURL,
			TokenURL: discordTokenURL,
		},
		Scopes: []string{"identify"},
	}
}

func GetChallongeOauth2() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("CHALLONGE_CLIENT_ID"),
		ClientSecret: os.Getenv("CHALLONGE_CLIENT_SECRET"),
		RedirectURL:  "http://127.0.0.1:7310/challonge/callback",
		Endpoint: oauth2.Endpoint{
			AuthURL:  challongeAuthURL,
			TokenURL: challongeTokenURL,
		},
		Scopes: []string{"me", "tournaments:read", "participants:read", "matches:read"},
	}
}

func saveTokenToFile(filename string, token *oauth2.Token) error {
	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return err
	}

	bytes, err := json.Marshal(token)
	if err != nil {
		return err
	}
	return os.WriteFile(filename, bytes, 0600)
}

func GetTokenFromFile(filename string) (*oauth2.Token, error) {
	bytes, err := os.ReadFile(filename)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrTokenNotFound
		}
		return nil, err
	}

	token := &oauth2.Token{}
	if err := json.Unmarshal(bytes, token); err != nil {
		return nil, err
	}
	return token, nil
}

// StartAuth инициализирует OAuth-флоу и возвращает URL для открытия в браузере,
// а также канал, в который придет код авторизации.
func (ac *AuthClient) StartAuth(ctx context.Context) (string, chan string, error) {
	if ac.Config == nil {
		return "", nil, fmt.Errorf("Config is nil. Check your Get...Oauth2 functions")
	}
	if ac.CallbackServer == nil {
		return "", nil, fmt.Errorf("OAuth callback server is nil")
	}

	state := uuid.New().String()
	codeChan := make(chan string, 1)
	ac.CallbackServer.Register(ac.CallbackPath, state, codeChan)
	authURL := ac.Config.AuthCodeURL(state)

	logger.Log(loggerEntity.Info, fmt.Sprintf("Link to auth: %v", authURL))

	return authURL, codeChan, nil
}

// FinishAuth ожидает код и обменивает его на токен.
func (ac *AuthClient) FinishAuth(ctx context.Context, codeChan chan string) error {
	var code string
	select {
	case code = <-codeChan:
	case <-ctx.Done():
		return ctx.Err()
	}

	token, err := ac.Config.Exchange(ctx, code)
	if err != nil {
		return err
	}

	if err := saveTokenToFile(ac.TokenFile, token); err != nil {
		return err
	}

	ac.Token = token
	ac.HTTPClient = ac.Config.Client(ctx, token)
	return nil
}

// Init проверяет наличие токена на диске. Если токена нет — запускает OAuth.
// Используется в основном для фоновых вызовов (например, при старте приложения).
func (ac *AuthClient) Init(ctx context.Context) error {
	if ac.Config == nil {
		return fmt.Errorf("Config is nil. Check your Get...Oauth2 functions")
	}
	if ac.CallbackServer == nil {
		return fmt.Errorf("OAuth callback server is nil")
	}

	token, err := GetTokenFromFile(ac.TokenFile)
	if err != nil && !errors.Is(err, ErrTokenNotFound) {
		logger.Log(loggerEntity.Warning, fmt.Sprintf("Token file is corrupted: %v", err))
		err = nil
	}

	tokenMissing := err != nil && errors.Is(err, ErrTokenNotFound)
	tokenCorrupted := err != nil && !errors.Is(err, ErrTokenNotFound)

	if tokenCorrupted {
		logger.Log(loggerEntity.Warning, fmt.Sprintf("Token file corrupted: %v, restarting OAuth", err))
	}

	needOAuth := tokenMissing || tokenCorrupted || token == nil

	if !needOAuth && tokenExpired(token) && token.RefreshToken == "" {
		logger.Log(loggerEntity.Warning, fmt.Sprintf("Token expired and no refresh_token in %s. Starting OAuth flow...", ac.TokenFile))
		needOAuth = true
	}

	if needOAuth {
		logger.Log(loggerEntity.Warning,
			fmt.Sprintf("Token invalid or missing is %s, starting web flow...\n", ac.TokenFile))

		authURL, codeChan, err := ac.StartAuth(ctx)
		if err != nil {
			return err
		}

		// Если Init вызывается в фоне (без UI), открываем браузер системно.
		// Для UI-вызовов используйте StartAuth + FinishAuth напрямую из App методов.
		if err := exec.Command(
			"rundll32",
			"url.dll,FileProtocolHandler",
			authURL,
		).Start(); err != nil {
			return err
		}

		return ac.FinishAuth(ctx, codeChan)
	}

	ac.Token = token
	ac.HTTPClient = ac.Config.Client(ctx, token)

	return nil
}

func (ac *AuthClient) ensureClient(ctx context.Context) error {
	if ac.HTTPClient == nil {
		return ac.Init(ctx)
	}
	return nil
}

func tokenExpired(t *oauth2.Token) bool {
	if t == nil {
		return true
	}
	if t.Expiry.IsZero() {
		return false
	}
	return time.Now().After(t.Expiry)
}

func (ac *AuthClient) TryRestore(ctx context.Context) error {
	if ac.Config == nil {
		return fmt.Errorf("config is nil")
	}
	if ac.TokenFile == "" {
		return fmt.Errorf("token file path is empty")
	}

	token, err := GetTokenFromFile(ac.TokenFile)
	if errors.Is(err, ErrTokenNotFound) {
		return ErrTokenMissing
	}
	if err != nil {
		return fmt.Errorf("read token: %w", err)
	}

	// Токен есть. Пробуем refresh через oauth2.
	ts := ac.Config.TokenSource(ctx, token)
	newToken, err := ts.Token()
	if err != nil {
		return fmt.Errorf("refresh token: %w", err)
	}

	// Если токен обновился — сохраняем
	if newToken.AccessToken != token.AccessToken {
		if err := saveTokenToFile(ac.TokenFile, newToken); err != nil {
			logger.Log(loggerEntity.Warning,
				fmt.Sprintf("failed to save refreshed token: %v", err))
		}
	}

	ac.Token = newToken
	ac.HTTPClient = ac.Config.Client(ctx, newToken)
	return nil
}
