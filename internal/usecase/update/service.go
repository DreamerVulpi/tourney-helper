package update

import (
	"context"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/update"
	"golang.org/x/mod/semver"
)

type Provider interface {
	GetLatestRelease(ctx context.Context) (*entity.ReleaseInfo, error)
}

type Service struct {
	provider Provider
	current  string
}

func NewService(provider Provider, currentVersion string) *Service {
	return &Service{
		provider: provider,
		current:  currentVersion,
	}
}

func isNewer(current, latest string) bool {
	if !semver.IsValid(current) {
		return false
	}

	if !semver.IsValid(latest) {
		return false
	}

	return semver.Compare(latest, current) > 0
}

func (s *Service) Check(ctx context.Context) (*entity.UpdateInfo, error) {
	release, err := s.provider.GetLatestRelease(ctx)
	if err != nil {
		return nil, err
	}

	return &entity.UpdateInfo{
		Available: isNewer(s.current, release.Version),
		Current:   s.current,
		Latest:    release,
	}, nil
}
