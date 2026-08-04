package update

import (
	"context"
	"encoding/json"
	"fmt"

	"net/http"

	"time"

	"regexp"

	"strings"

	"github.com/dreamervulpi/tourney-helper/internal/entity/update"
)

var descriptionRegexp = regexp.MustCompile(
	`(?s)###\s+🇬🇧\s+English\s*(.*?)###\s+🇷🇺\s+Русский\s*(.*)`,
)

type GitHub struct {
	owner string
	repo  string
}

type githubRelease struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	PublishedAt string `json:"published_at"`
	HTMLURL     string `json:"html_url"`

	Assets []struct {
		Name string `json:"name"`
		URL  string `json:"browser_download_url"`
		Size int64  `json:"size"`
	} `json:"assets"`
}

func NewGithub(owner, repo string) *GitHub {
	return &GitHub{
		owner: owner,
		repo:  repo,
	}
}

func (g *GitHub) GetLatestRelease(ctx context.Context) (*update.ReleaseInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", g.owner, g.repo)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api returned status %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	return mapGithubRelease(release)
}

func mapGithubRelease(release githubRelease) (*update.ReleaseInfo, error) {
	description := parseDescription(release.Body)
	publishedAt, err := time.Parse(time.RFC3339, release.PublishedAt)
	if err != nil {
		return nil, err
	}
	result := &update.ReleaseInfo{
		Version:     release.TagName,
		Name:        release.Name,
		Description: description,
		URL:         release.HTMLURL,
		PublishedAt: publishedAt,
	}

	for _, asset := range release.Assets {
		result.Assets = append(result.Assets, update.Asset{Name: asset.Name, URL: asset.URL, Size: asset.Size})
	}

	return result, nil
}

func parseDescription(body string) update.Description {
	matches := descriptionRegexp.FindStringSubmatch(body)
	if len(matches) != 3 {
		return update.Description{
			English: strings.TrimSpace(body),
			Russian: strings.TrimSpace(body),
		}
	}

	english := strings.TrimSpace(matches[1])
	russian := strings.TrimSpace(matches[2])

	english = strings.TrimSuffix(english, "---")
	english = strings.TrimSpace(english)

	return update.Description{
		English: english,
		Russian: russian,
	}
}
