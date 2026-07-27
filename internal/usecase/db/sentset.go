package db

import (
	"context"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/db"
)

type SentSet struct {
	Repo entity.SentSetRepo
}

func (p *SentSet) WithTx(tx entity.SQLHandler) *SentSet {
	return &SentSet{Repo: p.Repo.WithTx(tx)}
}

func (s *SentSet) IsExists(ctx context.Context, request entity.SentSetCheckRequest) (entity.SentSetCheckResponse, error) {
	state, err := s.Repo.Exists(ctx, request.SetId)
	if err != nil {
		return entity.SentSetCheckResponse{}, err
	}
	return entity.SentSetCheckResponse{State: state}, nil
}

func (s *SentSet) AddSentSet(ctx context.Context, request entity.SentSetAddRequest) (entity.SentSetAddResponse, error) {
	setId, err := s.Repo.Add(ctx, request.SetId, request.TournamentPlatform, request.MessengerPlatform, request.TournamentSlug, request.State, request.SentAtP1, request.SentAtP2)
	if err != nil {
		return entity.SentSetAddResponse{}, err
	}
	return entity.SentSetAddResponse{SetId: setId}, nil
}

func (s *SentSet) EditSentSet(ctx context.Context, request entity.SentSetEditRequest) (entity.SentSetEditResponse, error) {
	_, err := s.Repo.Get(ctx, request.SetId)
	if err != nil {
		return entity.SentSetEditResponse{}, err
	}

	err = s.Repo.Edit(ctx, request.SetId, request.TournamentPlatform, request.MessengerPlatform, request.TournamentSlug, request.State, request.SentAtP1, request.SentAtP2)
	if err != nil {
		return entity.SentSetEditResponse{}, err
	}

	return entity.SentSetEditResponse{}, nil
}

func (s *SentSet) DeleteSentSet(ctx context.Context, id int64) (entity.SentSetDeleteResponse, error) {
	_, err := s.Repo.Get(ctx, id)
	if err != nil {
		return entity.SentSetDeleteResponse{}, err
	}

	err = s.Repo.Del(ctx, id)
	if err != nil {
		return entity.SentSetDeleteResponse{}, err
	}

	return entity.SentSetDeleteResponse{}, nil
}

func (s *SentSet) GetSentSet(ctx context.Context, setId int64) (*entity.SentSetGetResponse, error) {
	sentSet, err := s.Repo.Get(ctx, setId)
	if err != nil {
		return nil, err
	}

	var result entity.SentSetGetResponse
	result = entity.SentSetGetResponse{
		SetId:              sentSet.SetId,
		TournamentPlatform: sentSet.TournamentPlatform,
		MessengerPlatform:  sentSet.MessengerPlatform,
		TournamentSlug:     sentSet.TournamentSlug,
		State:              sentSet.State,
		SentAtP1:           sentSet.SentAtP1,
		SentAtP2:           sentSet.SentAtP2,
	}
	return &result, err
}
