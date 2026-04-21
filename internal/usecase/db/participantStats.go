package db

import (
	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantStatsRepo interface {
	Add(
		participantId int,
		gameName string,
		gameId string,
		rating int,
	) (int, error)
	Edit(
		id int,
		participantId int,
		gameName string,
		gameId string,
		rating int,
	) error
	DelByGame(
		participantId int,
		gameName string,
	) error
	GetById(
		participantId int,
	) ([]entity.ParticipantStat, error)
	GetByGame(
		participantId int,
		gameName string,
	) (entity.ParticipantStat, error)
}

type ParticipantStats struct {
	Repo ParticipantStatsRepo
}

func (p ParticipantStats) AddParticipantStats(request entity.ParticipantStatAddRequest) (entity.ParticipantStatAddResponse, error) {
	id, err := p.Repo.Add(request.ParticipantId, request.GameName, request.GameId, request.Rating)
	if err != nil {
		return entity.ParticipantStatAddResponse{}, err
	}
	return entity.ParticipantStatAddResponse{Id: id}, nil
}

func (p ParticipantStats) EditParticipantStats(request entity.ParticipantStatEditRequest) (entity.ParticipantEditResponse, error) {
	err := p.Repo.Edit(request.Id, request.ParticipantId, request.GameName, request.GameId, request.Rating)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	return entity.ParticipantEditResponse{}, nil
}

func (p ParticipantStats) DeleteParticipantStatsByGame(request entity.ParticipantStatDeleteRequestByGame) (entity.ParticipantStatDeleteResponse, error) {
	err := p.Repo.DelByGame(request.ParticipantId, request.GameName)
	if err != nil {
		return entity.ParticipantStatDeleteResponse{}, err
	}
	return entity.ParticipantStatDeleteResponse{}, nil
}

func (p ParticipantStats) GetParticipantStatsByParticipantId(request entity.ParticipantStatsGetRequestById) ([]entity.ParticipantStatGetResponse, error) {
	stats, err := p.Repo.GetById(request.ParticipantId)
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

func (p ParticipantStats) GetParticipantStatsByGame(request entity.ParticipantStatGetRequestByGame) (entity.ParticipantStatGetResponse, error) {
	stat, err := p.Repo.GetByGame(request.ParticipantId, request.GameName)
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
