package challonge

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/dreamervulpi/tourney-helper/internal/entity/challonge"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

type Client struct {
	httpClient *http.Client
	token      string
}

func NewClient(clt *http.Client, token string) *Client {
	return &Client{
		httpClient: clt,
		token:      token,
	}
}

func PrepareQuery(query string, variables map[string]interface{}) map[string]interface{} {
	return map[string]interface{}{
		"query":     query,
		"variables": variables,
	}
}

func ExtractSlug(input string) string {
	if strings.Contains(input, "challonge.com/") {
		parts := strings.Split(strings.TrimRight(input, "/"), "/")
		return parts[len(parts)-1]
	}
	return input
}

// Execute query for get raw data
func (c *Client) RunQuery(ctx context.Context, path string, pathParams ...any) ([]byte, error) {
	fullPath := fmt.Sprintf(path, pathParams...)
	url := fmt.Sprintf("https://api.challonge.com/v2/%s", fullPath)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("GetData | http request creation failed: %w", err)
	}

	req.Header.Set("Content-Type", "application/vnd.api+json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization-Type", "v2")

	if c.token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.token))
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, errors.Join(errors.New("HTTP Response - "), err)
	}
	defer res.Body.Close() //nolint:errcheck

	data, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, errors.Join(errors.New("read Data - "), err)
	}

	logger.Log(entityLogger.Info, fmt.Sprintf("Raw JSON from Challonge: %s", string(data)))

	validation, err := validateData(data)
	if err != nil {
		return nil, err
	}
	if validation != "" {
		return nil, fmt.Errorf("data Validation: %s", validation)
	}

	return data, nil
}

func validateData(data []byte) (string, error) {
	results := &challonge.ErrorResponse{}

	err := json.Unmarshal(data, results)
	if err != nil {
		return "", nil
	}

	if len(results.Detail) != 0 {
		return fmt.Sprintf("validateData | Code %v - %v", results.Status, results.Detail), nil
	}

	return "", nil
}

// Execute query for get data from challonge according T type
func GetData[T any](c *Client, ctx context.Context, path string, pathParams ...any) (*T, error) {
	rawData, err := c.RunQuery(ctx, path, pathParams...)
	if err != nil {
		return nil, fmt.Errorf("RunQuery - %w", err)
	}

	var results T
	err = json.Unmarshal(rawData, &results)
	if err != nil {
		return nil, fmt.Errorf("JSON Unmarshal - %w", err)
	}

	return &results, nil
}
