package db

import (
	"time"

	entity "github.com/dreamervulpi/tourneyBot/internal/entity/db"
)

type ParticipantAccountsRepo interface {
	Add(participantId int,
		platformName string,
		platformId string,
		platformLogin string,
		isFound bool,
		updatedAt time.Time) (int, error)
	Edit(Id int,
		participantId int,
		platformName string,
		platformId string,
		platformLogin string,
		isFound bool,
		updatedAt time.Time) error
	DelByPlatform(
		participantId int,
		platformName string,
		platformId string) error
	GetById(id int) ([]entity.ParticipantAccount, error)
	GetByPlatform(
		participantId int,
		platformName string,
		platformId string) (entity.ParticipantAccount, error)
}

type ParticipantAccounts struct {
	Repo ParticipantAccountsRepo
}

func (p *ParticipantAccounts) AddParticipantAccount(request entity.ParticipantAccountAddRequest) (entity.ParticipantAccountAddResponse, error) {
	id, err := p.Repo.Add(request.ParticipantId, request.PlatformName, request.PlatformId, request.PlatformLogin, request.IsFound, request.UpdatedAt)
	if err != nil {
		return entity.ParticipantAccountAddResponse{}, err
	}
	return entity.ParticipantAccountAddResponse{Id: id}, nil
}

func (p *ParticipantAccounts) EditParticipantAccount(request entity.ParticipantAccountEditRequest) (entity.ParticipantAccountEditResponse, error) {
	err := p.Repo.Edit(request.Id, request.ParticipantId, request.PlatformName, request.PlatformId, request.PlatformLogin, request.IsFound, request.UpdatedAt)
	if err != nil {
		return entity.ParticipantAccountEditResponse{}, err
	}
	return entity.ParticipantAccountEditResponse{}, nil
}

func (p *ParticipantAccounts) DeleteParticipantAccountByPlatform(request entity.ParticipantAccountDeleteRequestByPlatform) (entity.ParticipantAccountDeleteResponse, error) {
	err := p.Repo.DelByPlatform(request.ParticipantId, request.PlatformName, request.PlatformId)
	if err != nil {
		return entity.ParticipantAccountDeleteResponse{}, err
	}
	return entity.ParticipantAccountDeleteResponse{}, nil
}

func (p *ParticipantAccounts) GetParticipantAccountsByParticipantId(request entity.ParticipantAccountsGetRequestById) ([]entity.ParticipantAccountGetResponse, error) {
	accounts, err := p.Repo.GetById(request.ParticipantId)
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
		a.PlatformId = account.PlatformId
		a.IsFound = account.IsFound
		a.UpdatedAt = account.UpdatedAt
		response = append(response, a)
	}

	return response, nil
}

func (p *ParticipantAccounts) GetParticipantAccountByPlatform(request entity.ParticipantAccountGetRequestByPlatform) (entity.ParticipantAccountGetResponse, error) {
	account, err := p.Repo.GetByPlatform(request.ParticipantId, request.PlatformName, request.PlatformId)
	if err != nil {
		return entity.ParticipantAccountGetResponse{}, err
	}
	return entity.ParticipantAccountGetResponse{
		Id:            account.Id,
		ParticipantId: account.ParticipantId,
		PlatformName:  account.PlatformName,
		PlatformLogin: account.PlatformLogin,
		PlatformId:    account.PlatformId,
		IsFound:       account.IsFound,
		UpdatedAt:     account.UpdatedAt,
	}, nil
}
