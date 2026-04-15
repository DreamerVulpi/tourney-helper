package auth

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"log"
	"net/http"

	"fmt"

	"os/exec"

	"bytes"

	"golang.org/x/oauth2"
)

const (
	addr              = "127.0.0.1:7310"
	startggAuthURL    = "https://start.gg/oauth/authorize"
	startggTokenURL   = "https://api.start.gg/oauth/access_token"
	discordAuthURL    = "https://discord.com/api/oauth2/authorize"
	discordTokenURL   = "https://discord.com/api/oauth2/token"
	challongeAuthURL  = "https://api.challonge.com/oauth/authorize"
	challongeTokenURL = "https://api.challonge.com/oauth/token"
	challongeUserURL  = "https://api.challonge.com/v2/me.json"
)

type Identity struct {
	ID          string
	Username    string
	Platform    string
	RawResponse map[string]interface{}
}

type AuthClient struct {
	NamePlatform string
	Config       *oauth2.Config
	HTTPClient   *http.Client
	TokenFile    string
}

func GetStartggOauth2(clientID, clientSecret string) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://127.0.0.1:7310/callback",
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
		RedirectURL:  "http://127.0.0.1:7310/callback",
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
		RedirectURL:  "http://127.0.0.1:7310/callback",
		Endpoint: oauth2.Endpoint{
			AuthURL:  challongeAuthURL,
			TokenURL: challongeTokenURL,
		},
		Scopes: []string{"me", "tournaments:read", "participants:read", "matches:read"},
	}
}

func saveTokenToFile(filename string, token *oauth2.Token) error {
	bytes, err := json.Marshal(token)
	if err != nil {
		return err
	}
	return os.WriteFile(filename, bytes, 0600)
}

func GetTokenFromFile(filename string) (*oauth2.Token, error) {
	bytes, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	token := &oauth2.Token{}
	return token, json.Unmarshal(bytes, token)
}

func (ac *AuthClient) Init(ctx context.Context) error {
	if ac.Config == nil {
		return fmt.Errorf("auth | config is nil. check your Get...Oauth2 functions")
	}

	token, err := GetTokenFromFile(ac.TokenFile)
	if err != nil || !token.Valid() {
		log.Printf("auth | token invalid or missing is %s, starting web flow...", ac.TokenFile)
		codeChan := make(chan string)

		mux := http.NewServeMux()
		server := &http.Server{Addr: addr, Handler: mux}

		mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
			code := r.URL.Query().Get("code")
			_, err := fmt.Fprint(w, "Authurization is success! Back to programm.")
			if err != nil {
				log.Printf("auth | Authurization isn't correct: %v\n", err)
				return
			}
			codeChan <- code
		})

		// launch server for listening
		go func() {
			if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				log.Fatalf("HTTP Server error: %v", err)
			}
		}()

		authURL := ac.Config.AuthCodeURL("state")
		log.Printf("Link to auth: %v", authURL)

		// open browser for os windows
		if err := exec.Command("rundll32", "url.dll,FileProtocolHandler", authURL).Start(); err != nil {
			return err
		}
		var code string
		select {
		case code = <-codeChan:
		case <-ctx.Done():
			if err := server.Shutdown(context.Background()); err != nil {
				return ctx.Err()
			}
		}

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return err
		}

		token, err = ac.Config.Exchange(ctx, code)
		if err != nil {
			return err
		}
		if err := saveTokenToFile(ac.TokenFile, token); err != nil {
			return err
		}
	}

	ac.HTTPClient = ac.Config.Client(ctx, token)
	return nil
}

func (ac *AuthClient) ensureClient(ctx context.Context) error {
	if ac.HTTPClient == nil {
		return ac.Init(ctx)
	}
	return nil
}

func (ac *AuthClient) GetDiscordMe(ctx context.Context) (*Identity, error) {
	if err := ac.ensureClient(ctx); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "GET", "https://discord.com/api/users/@me", nil)
	if err != nil {
		return nil, err
	}
	resp, err := ac.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data struct {
		ID       string `json:"id"`
		Username string `json:"username"`
	}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		return nil, err
	}
	return &Identity{ID: data.ID, Username: data.Username, Platform: "discord"}, nil
}

func (ac *AuthClient) GetChallongeMe(ctx context.Context) (*Identity, error) {
	if err := ac.ensureClient(ctx); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "GET", challongeUserURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/vnd.api+json")
	req.Header.Set("Accept", "application/json")

	req.Header.Set("Authorization", "Bearer OauthTokenGoesInPlaceOfThis")
	req.Header.Set("Authorization-Type", "v2")

	resp, err := ac.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("getChallongeMe | challonge API error: status %d", resp.StatusCode)
	}

	var response struct {
		Data struct {
			ID         string `json:"id"`
			Attributes struct {
				Username string `json:"username"`
			} `json:"attributes"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	return &Identity{
		ID:       response.Data.ID,
		Username: response.Data.Attributes.Username,
		Platform: "challonge",
	}, nil
}

func (ac *AuthClient) GetStartGGMe(ctx context.Context) (*Identity, error) {
	if err := ac.ensureClient(ctx); err != nil {
		return nil, err
	}

	query := `{"query": "query { currentUser { id name } }"}`

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.start.gg/gql/alpha", bytes.NewBufferString(query))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := ac.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var response struct {
		Data struct {
			CurrentUser struct {
				ID   json.Number `json:"id"`
				Name string      `json:"name"`
			} `json:"currentUser"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	return &Identity{
		ID:       response.Data.CurrentUser.ID.String(),
		Username: response.Data.CurrentUser.Name,
		Platform: "startgg",
	}, nil
}

func TestStartGGCall(ac *AuthClient) {
	ctx := context.Background()

	me, err := ac.GetStartGGMe(ctx)
	if err != nil {
		log.Fatalf("Failed check user on Start.gg: %v", err)
	}

	fmt.Printf("Success! User: %s (ID: %s) on platform %s\n",
		me.Username, me.ID, me.Platform)
}

func TestChallongeCall(ac *AuthClient) {
	ctx := context.Background()

	me, err := ac.GetChallongeMe(ctx)
	if err != nil {
		log.Fatalf("Failed check user on Challonge: %v", err)
	}

	fmt.Printf("Success! User: %s (ID: %s) on platform %s\n",
		me.Username, me.ID, me.Platform)
}
