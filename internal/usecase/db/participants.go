package db

import (
	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantRepo interface {
	Add(nickname string,
		region string,
		locale string) (int, error)
	Edit(id int,
		nickname string,
		region string,
		locale string) error
	Del(id int) error
	GetById(id int) (entity.Participant, error)
	GetByNickname(nickname string) (entity.Participant, error)
}

type Participant struct {
	Repo ParticipantRepo
}

func (p *Participant) AddParticipant(request entity.ParticipantAddRequest) (entity.ParticipantAddResponse, error) {
	id, err := p.Repo.Add(
		request.Nickname,
		request.Region,
		request.Locale,
	)
	if err != nil {
		return entity.ParticipantAddResponse{}, err
	}
	return entity.ParticipantAddResponse{Id: id}, nil
}

func (p *Participant) EditParticipant(request entity.ParticipantEditRequest) (entity.ParticipantEditResponse, error) {
	_, err := p.Repo.GetById(request.Id)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	_, err = p.Repo.GetByNickname(request.Nickname)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}

	err = p.Repo.Edit(
		request.Id,
		request.Nickname,
		request.Region,
		request.Locale,
	)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	return entity.ParticipantEditResponse{}, nil
}

func (p *Participant) DelParticipant(request entity.ParticipantDeleteRequest) (entity.ParticipantDeleteResponse, error) {
	_, err := p.Repo.GetById(request.Id)
	if err != nil {
		return entity.ParticipantDeleteResponse{}, err
	}

	err = p.Repo.Del(request.Id)
	if err != nil {
		return entity.ParticipantDeleteResponse{}, err
	}
	return entity.ParticipantDeleteResponse{}, nil
}

func (p *Participant) GetParticipantById(request entity.ParticipantGetRequestById) (entity.ParticipantGetResponse, error) {
	participant, err := p.Repo.GetById(request.Id)
	if err != nil {
		return entity.ParticipantGetResponse{}, err
	}
	return entity.ParticipantGetResponse{
		Id:        participant.Id,
		Nickname:  participant.Nickname,
		Region:    participant.Region,
		Locale:    participant.Locale,
		UpdatedAt: participant.UpdatedAt,
	}, nil
}

func (p *Participant) GetParticipantByNickname(request entity.ParticipantGetRequestByNickname) (entity.ParticipantGetResponse, error) {
	participant, err := p.Repo.GetByNickname(request.Nickname)
	if err != nil {
		return entity.ParticipantGetResponse{}, err
	}
	return entity.ParticipantGetResponse{
		Id:        participant.Id,
		Nickname:  participant.Nickname,
		Region:    participant.Region,
		Locale:    participant.Locale,
		UpdatedAt: participant.UpdatedAt,
	}, nil
}
