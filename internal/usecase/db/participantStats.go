package db

import (
	"context"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantStats struct {
	Repo entity.ParticipantStatsRepo
}

func (p *ParticipantStats) WithTx(tx entity.SQLHandler) *ParticipantStats {
	return &ParticipantStats{Repo: p.Repo.WithTx(tx)}
}

func (p ParticipantStats) AddParticipantStats(ctx context.Context, request entity.ParticipantStatAddRequest) (entity.ParticipantStatAddResponse, error) {
	id, err := p.Repo.Add(ctx, request.ParticipantId, request.GameName, request.GameId, request.Rating)
	if err != nil {
		return entity.ParticipantStatAddResponse{}, err
	}
	return entity.ParticipantStatAddResponse{Id: id}, nil
}

func (p ParticipantStats) EditParticipantStats(ctx context.Context, request entity.ParticipantStatEditRequest) (entity.ParticipantEditResponse, error) {
	err := p.Repo.Edit(ctx, request.ParticipantId, request.GameName, request.GameId, request.Rating)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	return entity.ParticipantEditResponse{}, nil
}

func (p ParticipantStats) EditParticipantStatsRating(ctx context.Context, request entity.ParticipantStatEditRatingRequest) (entity.ParticipantEditResponse, error) {
	err := p.Repo.EditRating(ctx, request.Id, request.Rating)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	return entity.ParticipantEditResponse{}, nil
}

func (p ParticipantStats) DeleteParticipantStatsByGame(ctx context.Context, request entity.ParticipantStatDeleteRequestByGame) (entity.ParticipantStatDeleteResponse, error) {
	err := p.Repo.DelByGame(ctx, request.ParticipantId, request.GameName)
	if err != nil {
		return entity.ParticipantStatDeleteResponse{}, err
	}
	return entity.ParticipantStatDeleteResponse{}, nil
}

func (p ParticipantStats) GetParticipantStatsByParticipantId(ctx context.Context, request entity.ParticipantStatsGetRequestById) ([]entity.ParticipantStatGetResponse, error) {
	stats, err := p.Repo.GetById(ctx, request.ParticipantId)
	if err != nil {
		return []entity.ParticipantStatGetResponse{}, err
	}

	var response []entity.ParticipantStatGetResponse
	for _, stat := range stats {
		var a entity.ParticipantStatGetResponse
		a.Id = stat.Id
		a.ParticipantId = stat.ParticipantId
		a.GameId = stat.GameId
		a.GameName = stat.GameName
		a.Rating = stat.Rating
		a.UpdatedAt = stat.UpdatedAt
		response = append(response, a)
	}
	return response, nil
}

func (p ParticipantStats) GetParticipantStatsByGame(ctx context.Context, request entity.ParticipantStatGetRequestByGame) (entity.ParticipantStatGetResponse, error) {
	stat, err := p.Repo.GetByGame(ctx, request.ParticipantId, request.GameName)
	if err != nil {
		return entity.ParticipantStatGetResponse{}, err
	}
	return entity.ParticipantStatGetResponse{
		Id:            stat.Id,
		ParticipantId: stat.ParticipantId,
		GameName:      stat.GameName,
		GameId:        stat.GameId,
		Rating:        stat.Rating,
		UpdatedAt:     stat.UpdatedAt,
	}, nil
}
