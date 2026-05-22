package db

import (
	"context"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantBans struct {
	Repo entity.ParticipantBansRepo
}

func (p *ParticipantBans) WithTx(tx entity.SQLHandler) *ParticipantBans {
	return &ParticipantBans{Repo: p.Repo.WithTx(tx)}
}

func (p *ParticipantBans) AddParticipantBan(ctx context.Context, request entity.ParticipantBansAddRequest) (entity.ParticipantBansAddResponse, error) {
	id, err := p.Repo.Add(ctx, request.ParticipantId, request.TypeBan, request.Reason, request.ExpiresAt)
	if err != nil {
		return entity.ParticipantBansAddResponse{}, err
	}
	return entity.ParticipantBansAddResponse{Id: id}, nil
}

func (p *ParticipantBans) EditParticipantBan(ctx context.Context, request entity.ParticipantBansEditRequest) (entity.ParticipantEditResponse, error) {
	err := p.Repo.Edit(ctx, request.Id, request.ParticipantId, request.TypeBan, request.Reason, request.ExpiresAt)
	if err != nil {
		return entity.ParticipantEditResponse{}, err
	}
	return entity.ParticipantEditResponse{}, nil
}

func (p *ParticipantBans) DeleteExpiredBans(ctx context.Context) error {
	err := p.Repo.DeleteExpired(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (p *ParticipantBans) DeleteParticipantBanById(ctx context.Context, request entity.ParticipantBansDeleteRequest) (entity.ParticipantBansDeleteResponse, error) {
	err := p.Repo.Delete(ctx, request.ParticipantId)
	if err != nil {
		return entity.ParticipantBansDeleteResponse{}, err
	}
	return entity.ParticipantBansDeleteResponse{}, nil
}

func (p *ParticipantBans) GetParticipantBan(ctx context.Context, request entity.ParticipantBansGetRequest) (entity.ParticipantBansGetResponse, error) {
	ban, err := p.Repo.Get(ctx, request.ParticipantId)
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

func (p *ParticipantBans) GetPartipantsListBans(ctx context.Context, request entity.ParticipantBansGetListRequest) (entity.ParticipantGetListResponse, error) {
	list, err := p.Repo.GetList(ctx, request.GameName, request.Limit, request.Offset, request.Search)
	if err != nil {
		return entity.ParticipantGetListResponse{}, err
	}
	return entity.ParticipantGetListResponse{ListBanned: list}, err
}

func (p *ParticipantBans) IsBanned(ctx context.Context, request entity.ParticipantIsBannedRequest) (entity.ParticipantIsBannedResponse, error) {
	state, err := p.Repo.IsBanned(ctx, request.ParticipantId)
	if err != nil {
		return entity.ParticipantIsBannedResponse{}, err
	}
	return entity.ParticipantIsBannedResponse{IsBanned: state}, nil
}
