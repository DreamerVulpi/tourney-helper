package db

import (
	"context"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/db"
)

type ParticipantAccounts struct {
	Repo entity.ParticipantAccountsRepo
}

func (p *ParticipantAccounts) WithTx(tx entity.SQLHandler) *ParticipantAccounts {
	return &ParticipantAccounts{Repo: p.Repo.WithTx(tx)}
}

func (p *ParticipantAccounts) AddParticipantAccount(ctx context.Context, request entity.ParticipantAccountAddRequest) (entity.ParticipantAccountAddResponse, error) {
	id, err := p.Repo.Add(ctx, request.ParticipantId, request.PlatformName, request.PlatformId, request.DmChannelId, request.PlatformLogin, request.IsFound)
	if err != nil {
		return entity.ParticipantAccountAddResponse{}, err
	}
	return entity.ParticipantAccountAddResponse{Id: id}, nil
}

func (p *ParticipantAccounts) EditParticipantAccount(ctx context.Context, request entity.ParticipantAccountEditRequest) (entity.ParticipantAccountEditResponse, error) {
	err := p.Repo.Edit(ctx, request.ParticipantId, request.PlatformName, request.PlatformId, request.DmChannelId, request.PlatformLogin, request.IsFound)
	if err != nil {
		return entity.ParticipantAccountEditResponse{}, err
	}
	return entity.ParticipantAccountEditResponse{}, nil
}

func (p *ParticipantAccounts) EditDmChannelParticipantAccount(ctx context.Context, request entity.ParticipantAccoutnEditDMChannelRequest) error {
	err := p.Repo.EditDmChannel(ctx, request.ParticipantId, request.PlatformName, request.DmChannelId)
	if err != nil {
		return err
	}
	return nil
}

func (p *ParticipantAccounts) DeleteParticipantAccountByPlatform(ctx context.Context, request entity.ParticipantAccountDeleteRequestByPlatform) (entity.ParticipantAccountDeleteResponse, error) {
	err := p.Repo.DelByPlatform(ctx, request.ParticipantId, request.PlatformName, request.PlatformId)
	if err != nil {
		return entity.ParticipantAccountDeleteResponse{}, err
	}
	return entity.ParticipantAccountDeleteResponse{}, nil
}

func (p *ParticipantAccounts) GetParticipantAccountsByParticipantId(ctx context.Context, request entity.ParticipantAccountsGetRequestById) ([]entity.ParticipantAccountGetResponse, error) {
	accounts, err := p.Repo.GetById(ctx, request.ParticipantId)
	if err != nil {
		return []entity.ParticipantAccountGetResponse{}, err
	}

	var response []entity.ParticipantAccountGetResponse
	for _, account := range accounts {
		var a entity.ParticipantAccountGetResponse
		a.Id = account.Id
		a.ParticipantId = account.ParticipantId
		a.PlatformName = account.PlatformName
		a.PlatformLogin = account.PlatformLogin
		a.DmChannelId = account.DmChannelId
		a.PlatformId = account.PlatformId
		a.IsFound = account.IsFound
		a.UpdatedAt = account.UpdatedAt
		response = append(response, a)
	}

	return response, nil
}

func (p *ParticipantAccounts) GetParticipantAccountByPlatform(ctx context.Context, request entity.ParticipantAccountGetRequestByPlatform) (entity.ParticipantAccountGetResponse, error) {
	account, err := p.Repo.GetByPlatform(ctx, request.PlatformName, request.PlatformId)
	if err != nil {
		return entity.ParticipantAccountGetResponse{}, err
	}
	return entity.ParticipantAccountGetResponse{
		Id:            account.Id,
		ParticipantId: account.ParticipantId,
		PlatformName:  account.PlatformName,
		PlatformLogin: account.PlatformLogin,
		DmChannelId:   account.DmChannelId,
		PlatformId:    account.PlatformId,
		IsFound:       account.IsFound,
		UpdatedAt:     account.UpdatedAt,
	}, nil
}

func (p *ParticipantAccounts) GetParticipantAccountByLogin(ctx context.Context, request entity.ParticipantAccountGetRequestByLogin) (entity.ParticipantAccountGetResponse, error) {
	account, err := p.Repo.GetByLogin(ctx, request.PlatformName, request.PlatformLogin)
	if err != nil {
		return entity.ParticipantAccountGetResponse{}, err
	}
	return entity.ParticipantAccountGetResponse{
		Id:            account.Id,
		ParticipantId: account.ParticipantId,
		PlatformName:  account.PlatformName,
		PlatformLogin: account.PlatformLogin,
		DmChannelId:   account.DmChannelId,
		PlatformId:    account.PlatformId,
		IsFound:       account.IsFound,
		UpdatedAt:     account.UpdatedAt,
	}, nil
}
