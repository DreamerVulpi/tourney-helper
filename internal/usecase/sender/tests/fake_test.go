package sender_test

import (
	"context"

	"database/sql"
	"time"

	entityDB "github.com/dreamervulpi/tourney-helper/internal/entity/db"
	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
	usecaseSender "github.com/dreamervulpi/tourney-helper/internal/usecase/sender"
)

type fakeSentSetRepo struct {
	sent map[int64]entityDB.SentSet
	err  error

	addCalled  bool
	addRequest entityDB.SentSetAddRequest
}

var _ entitySender.NotificationData = (*fakeNotificationData)(nil)

type fakeNotificationData struct {
	name string
}

func (f fakeNotificationData) GetSetsData(
	ctx context.Context,
	slug string,
) ([]entitySender.SetData, error) {
	return nil, nil
}

func (f fakeNotificationData) GetPlatformTournamentName() string {
	return f.name
}

func (f fakeNotificationData) GetTournamentSlug() (string, error) {
	return "", nil
}

var _ entitySender.NotificationSender = (*fakeNotificationSender)(nil)

type fakeNotificationSender struct {
	name string

	findParticipant entitySender.Participant
	findErr         error

	createChannelID *string
	createErr       error

	sendErr error

	logChannelEnabled bool
}

func (f fakeNotificationSender) FindContactOfParticipant(
	ctx context.Context,
	participant entitySender.Participant,
) (entitySender.Participant, error) {
	if f.findParticipant.MessengerLogin == "" {
		return participant, f.findErr
	}

	return f.findParticipant, f.findErr
}

func (f fakeNotificationSender) GetParticipantLocale(ctx context.Context, messengerID string) (string, error) {
	return "", nil
}

func (f fakeNotificationSender) SendMessage(
	ctx context.Context,
	targetID string,
	dmChannelID *string,
	data entitySender.SetData,
) (string, error) {
	if f.sendErr != nil {
		return "", f.sendErr
	}

	return "message-id", nil
}

func (f fakeNotificationSender) GetPlatformMessengerName() string {
	return f.name
}

func (f fakeNotificationSender) CreateDMChannel(
	ctx context.Context,
	platformID string,
) (*string, error) {
	return f.createChannelID, f.createErr
}

func (f fakeNotificationSender) IsLogChannelEnabled() bool {
	return f.logChannelEnabled
}

var _ entityDB.SentSetRepo = (*fakeSentSetRepo)(nil)

type fakeStartggClient struct {
	tournament startgg.Tournament
	groups     []startgg.PhaseGroupInfo

	sets map[int64]map[int][]startgg.Nodes

	tournamentErr error
	groupsErr     error
	setsErr       error
	lastGroupID   int64
	lastPage      int
	lastPerPage   int

	getSetsCalls int
	lastStates   []int
	Finals       entitySender.StartggFinalConfig
}

var _ entitySender.StartggClient = (*fakeStartggClient)(nil)

func newTestAdapter(client entitySender.StartggClient) *usecaseSender.StartggSetAdapter {
	return &usecaseSender.StartggSetAdapter{
		StartggSetAdapter: entitySender.StartggSetAdapter{
			Client:        client,
			UrlToEvent:    "https://www.start.gg/tournament/test/event/test",
			MessengerName: "Discord",
			DebugMode:     false,
			Contacts:      map[string]entitySender.Participant{},
			Game:          "Tekken 8",
		},
	}
}

func (f *fakeStartggClient) GetTournament(slug string) (startgg.Tournament, error) {
	if f.tournamentErr != nil {
		return startgg.Tournament{}, f.tournamentErr
	}

	return f.tournament, nil
}

func (f *fakeStartggClient) GetListGroups(slug string, states []int) ([]startgg.PhaseGroupInfo, error) {
	f.lastStates = append([]int(nil), states...)

	if f.groupsErr != nil {
		return nil, f.groupsErr
	}

	return f.groups, nil
}

func (f *fakeStartggClient) GetSets(
	groupID int64,
	page,
	perPage int,
	states []int,
) ([]startgg.Nodes, error) {

	f.getSetsCalls++

	f.lastGroupID = groupID
	f.lastPage = page
	f.lastPerPage = perPage
	f.lastStates = append([]int(nil), states...)

	if f.setsErr != nil {
		return nil, f.setsErr
	}

	return f.sets[groupID][page], nil
}

func (f *fakeSentSetRepo) Add(
	ctx context.Context,
	setId int64,
	tournamentPlatform string,
	messengerPlatform string,
	tournamentSlug string,
	state *entityDB.SetState,
	sentAtP1 *time.Time,
	sentAtP2 *time.Time,
) (int64, error) {
	f.addCalled = true

	f.addRequest = entityDB.SentSetAddRequest{
		SetId:              setId,
		TournamentPlatform: tournamentPlatform,
		MessengerPlatform:  messengerPlatform,
		TournamentSlug:     tournamentSlug,
		State:              state,
		SentAtP1:           sentAtP1,
		SentAtP2:           sentAtP2,
	}

	if f.err != nil {
		return 0, f.err
	}

	return setId, nil
}

func (f *fakeSentSetRepo) Get(
	ctx context.Context,
	setId int64,
) (entityDB.SentSet, error) {
	if f.err != nil {
		return entityDB.SentSet{}, f.err
	}

	if set, ok := f.sent[setId]; ok {
		return set, nil
	}

	return entityDB.SentSet{}, sql.ErrNoRows
}

func (f *fakeSentSetRepo) Del(
	ctx context.Context,
	setId int64,
) error {
	return nil
}

func (f *fakeSentSetRepo) Edit(
	ctx context.Context,
	setId int64,
	tournamentPlatform string,
	messengerPlatform string,
	tournamentSlug string,
	state *entityDB.SetState,
	sentAtP1 *time.Time,
	sentAtP2 *time.Time,
) error {
	return nil
}

func (f *fakeSentSetRepo) Exists(
	ctx context.Context,
	setId int64,
) (bool, error) {
	return false, nil
}

func (f *fakeSentSetRepo) WithTx(
	tx entityDB.SQLHandler,
) entityDB.SentSetRepo {
	return f
}

var _ entityDB.ParticipantRepo = (*fakeParticipantRepo)(nil)

type fakeParticipantRepo struct {
	participant entitySender.Participant

	getErr error
	addErr error

	addCalled bool
}

func (f *fakeParticipantRepo) GetByNickname(
	ctx context.Context,
	nickname string,
) (entityDB.Participant, error) {
	if f.getErr != nil {
		return entityDB.Participant{}, f.getErr
	}

	return entityDB.Participant{}, nil
}

func (f *fakeParticipantRepo) Add(
	ctx context.Context,
	nickname string,
	region string,
	locale string,
) (int, error) {

	f.addCalled = true

	if f.addErr != nil {
		return 0, f.addErr
	}

	return 1, nil
}

func (f *fakeParticipantRepo) Edit(
	ctx context.Context,
	id int,
	nickname string,
	region string,
	locale string,
) error {
	return nil
}

func (f *fakeParticipantRepo) EditLocale(
	ctx context.Context,
	id int,
	locale string,
) error {
	return nil
}

func (f *fakeParticipantRepo) Del(
	ctx context.Context,
	id int,
) error {
	return nil
}

func (f *fakeParticipantRepo) GetById(
	ctx context.Context,
	id int,
) (entityDB.Participant, error) {
	return entityDB.Participant{}, nil
}

func (f *fakeParticipantRepo) GetList(
	ctx context.Context,
	nameMessengerPlatform string,
	nameTournamentPlatform string,
	nameGame string,
	offset int,
	limit int,
	search string,
) ([]entitySender.Participant, error) {
	return nil, nil
}

func (f *fakeParticipantRepo) GetListSortByRating(
	ctx context.Context,
	nameMessengerPlatform string,
	nameTournamentPlatform string,
	nameGame string,
	offset int,
	limit int,
	search string,
) ([]entitySender.Participant, error) {
	return nil, nil
}

func (f *fakeParticipantRepo) TotalCount(
	ctx context.Context,
	nameGame string,
) (int, error) {
	return 0, nil
}

func (f *fakeParticipantRepo) TotalCountInRatingLeague(
	ctx context.Context,
	gameName string,
) (int, error) {
	return 0, nil
}

func (f *fakeParticipantRepo) WithTx(
	tx entityDB.SQLHandler,
) entityDB.ParticipantRepo {
	return f
}
