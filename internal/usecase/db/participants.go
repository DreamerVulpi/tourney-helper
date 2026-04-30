package db

import (
	"context"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type Participant struct {
	Repo entity.ParticipantRepo
}

func (p *Participant) WithTx(tx entity.SQLHandler) *Participant {
	return &Participant{Repo: p.Repo.WithTx(tx)}
}

func (p *Participant) AddParticipant(ctx context.Context, request entity.ParticipantAddRequest) (entity.ParticipantAddResponse, error) {
	id, err := p.Repo.Add(
		ctx,
		request.Nickname,
		request.Region,
		request.Locale,
	)
	if err != nil {
		return entity.ParticipantAddResponse{}, err
	}
	return entity.ParticipantAddResponse{Id: id}, nil
}

func (p *Participant) EditParticipant(ctx context.Context, request entity.ParticipantEditRequest) (entity.ParticipantEditResponse, error) {
	_, err := p.Repo.GetById(ctx, request.Id)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	_, err = p.Repo.GetByNickname(ctx, request.Nickname)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}

	err = p.Repo.Edit(
		ctx,
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

func (p *Participant) DelParticipant(ctx context.Context, request entity.ParticipantDeleteRequest) (entity.ParticipantDeleteResponse, error) {
	_, err := p.Repo.GetById(ctx, request.Id)
	if err != nil {
		return entity.ParticipantDeleteResponse{}, err
	}

	err = p.Repo.Del(ctx, request.Id)
	if err != nil {
		return entity.ParticipantDeleteResponse{}, err
	}
	return entity.ParticipantDeleteResponse{}, nil
}

func (p *Participant) GetParticipantById(ctx context.Context, request entity.ParticipantGetRequestById) (entity.ParticipantGetResponse, error) {
	participant, err := p.Repo.GetById(ctx, request.Id)
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

func (p *Participant) GetParticipantByNickname(ctx context.Context, request entity.ParticipantGetRequestByNickname) (entity.ParticipantGetResponse, error) {
	participant, err := p.Repo.GetByNickname(ctx, request.Nickname)
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
