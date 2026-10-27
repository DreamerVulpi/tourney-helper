package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

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

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Discord API returned %s: %s", resp.Status, string(body))
	}

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
