package db

import (
	"time"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantBansRepo interface {
	Add(participantId int,
		typeBan string,
		reason string,
		bannedAt time.Time,
		expiresAt *time.Time) (int, error)
	Edit(id int,
		participantId int,
		typeBan string,
		reason string,
		bannedAt time.Time,
		expiresAt *time.Time) error
	Del(
		participantId int) error
	Get(participantId int) (entity.ParticipantBans, error)
	IsBanned(id int) (bool, error)
}

type ParticipantBans struct {
	Repo ParticipantBansRepo
}

func (p *ParticipantBans) AddParticipantBan(request entity.ParticipantBansAddRequest) (entity.ParticipantBansAddResponse, error) {
	id, err := p.Repo.Add(request.ParticipantId, request.TypeBan, request.Reason, request.BannedAt, request.ExpiresAt)
	if err != nil {
		return entity.ParticipantBansAddResponse{}, err
	}
	return entity.ParticipantBansAddResponse{Id: id}, nil
}

func (p *ParticipantBans) EditParticipantBan(request entity.ParticipantBansEditRequest) (entity.ParticipantEditResponse, error) {
	err := p.Repo.Edit(request.Id, request.ParticipantId, request.TypeBan, request.Reason, request.BannedAt, request.ExpiresAt)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	return entity.ParticipantEditResponse{}, nil
}

func (p *ParticipantBans) DeleteParticipantBanById(request entity.ParticipantBansDeleteRequest) (entity.ParticipantBansDeleteResponse, error) {
	err := p.Repo.Del(request.ParticipantId)
	if err != nil {
		return entity.ParticipantBansDeleteResponse{}, err
	}
	return entity.ParticipantBansDeleteResponse{}, nil
}

func (p *ParticipantBans) GetParticipantBan(request entity.ParticipantBansGetRequest) (entity.ParticipantBansGetResponse, error) {
	ban, err := p.Repo.Get(request.ParticipantId)
	if err != nil {
		return entity.ParticipantBansGetResponse{}, err
	}
	return entity.ParticipantBansGetResponse{
		Id:            ban.Id,
		ParticipantId: ban.ParticipantId,
		TypeBan:       ban.TypeBan,
		Reason:        ban.Reason,
		BannedAt:      ban.BannedAt,
		ExpiresAt:     ban.ExpiresAt,
	}, nil
}

func (p *ParticipantBans) IsBanned(request entity.ParticipantIsBannedRequest) (entity.ParticipantIsBannedResponse, error) {
	state, err := p.Repo.IsBanned(request.ParticipantId)
	if err != nil {
		return entity.ParticipantIsBannedResponse{}, err
	}
	return entity.ParticipantIsBannedResponse{IsBanned: state}, nil
}
