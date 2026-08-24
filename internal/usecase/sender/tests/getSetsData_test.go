package sender_test

import (
	"testing"

	"context"
	"errors"

	"reflect"

	entitySender "github.com/dreamervulpi/tourney-helper/internal/entity/sender"
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/sender/tests/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetSetsData_Success(t *testing.T) {

	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test Tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 1,
					},
				},
			},
		},

		sets: map[int64]map[int][]startgg.Nodes{
			100: {
				1: {
					createSet(
						1,
						createParticipant(1, "Player1", "p1"),
						createParticipant(2, "Player2", "p2"),
						3,
						1,
					),
				},
			},
		},
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	require.NoError(t, err)
	require.Len(t, result, 1)

	assert.Equal(
		t,
		"Test Tournament",
		result[0].TournamentName,
	)

	assert.Equal(
		t,
		int64(1),
		result[0].SetID,
	)
}

func TestGetSetsData_TournamentError(t *testing.T) {
	client := &fakeStartggClient{
		tournamentErr: errors.New("tournament error"),
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireError(t, err)

	if result != nil {
		t.Fatalf("expected nil result, got %v", result)
	}
}

func TestGetSetsData_GroupsError(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test tournament",
		},

		groupsErr: errors.New("groups error"),
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireError(t, err)

	if result != nil {
		t.Fatalf("expected nil result, got %v", result)
	}
}

func TestGetSetsData_EmptyGroups(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test tournament",
		},

		groups: []startgg.PhaseGroupInfo{},
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireNoError(t, err)

	if len(result) != 0 {
		t.Fatalf(
			"expected empty result, got %d sets",
			len(result),
		)
	}
}

func TestGetSetsData_GetSetsError(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 1,
					},
				},
			},
		},

		setsErr: errors.New("sets error"),
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireNoError(t, err)

	if len(result) != 0 {
		t.Fatalf(
			"expected empty result, got %d",
			len(result),
		)
	}
}

func TestGetSetsData_ContextCanceled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test Tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 1,
					},
				},
			},
		},

		sets: map[int64]map[int][]startgg.Nodes{
			100: {
				1: {
					createSet(
						1,
						createParticipant(
							1,
							"Player1",
							"player1",
						),
						createParticipant(
							2,
							"Player2",
							"player2",
						),
						1,
						startgg.State(1),
					),
				},
			},
		},
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		ctx,
		"tournament/test/event/test",
	)

	testutil.RequireError(t, err)

	if !errors.Is(err, context.Canceled) {
		t.Fatalf(
			"expected context.Canceled, got %v",
			err,
		)
	}

	if result != nil {
		t.Fatalf(
			"expected nil result, got %v",
			result,
		)
	}
}

func TestGetSetsData_NoParticipants(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test Tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 1,
					},
				},
			},
		},

		sets: map[int64]map[int][]startgg.Nodes{
			100: {
				1: {
					{
						Id:    1,
						State: 1,
						Round: 1,

						Slots: []startgg.Slots{
							{
								Entrant: startgg.Entrant{
									Participants: []startgg.Participant{},
								},
							},
							{
								Entrant: startgg.Entrant{
									Participants: []startgg.Participant{
										createParticipant(
											2,
											"Player2",
											"player2",
										),
									},
								},
							},
						},
					},
				},
			},
		},
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireNoError(t, err)

	if len(result) != 0 {
		t.Fatalf(
			"expected empty result, got %d sets",
			len(result),
		)
	}
}

func TestGetSetsData_MultiplePages(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test Tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 120,
					},
				},
			},
		},

		sets: map[int64]map[int][]startgg.Nodes{
			100: {
				1: {
					createSet(
						1,
						createParticipant(1, "Player1", "p1"),
						createParticipant(2, "Player2", "p2"),
						1,
						startgg.State(1),
					),
				},

				2: {
					createSet(
						2,
						createParticipant(3, "Player3", "p3"),
						createParticipant(4, "Player4", "p4"),
						2,
						startgg.State(1),
					),
				},
			},
		},
	}

	adapter := newTestAdapter(client)

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireNoError(t, err)

	if len(result) != 2 {
		t.Fatalf(
			"expected 2 sets, got %d",
			len(result),
		)
	}

	if client.getSetsCalls != 2 {
		t.Fatalf(
			"expected 2 GetSets calls, got %d",
			client.getSetsCalls,
		)
	}
}

func TestGetSetsData_FinalsDetected(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test Tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 1,
					},
				},
			},
		},

		sets: map[int64]map[int][]startgg.Nodes{
			100: {
				1: {
					createSet(
						1,
						createParticipant(1, "Player1", "p1"),
						createParticipant(2, "Player2", "p2"),
						5,
						startgg.State(1),
					),
				},
			},
		},

		Finals: entitySender.StartggFinalConfig{
			FinalBracketId: 100,

			MinRoundNumA: 5,
			MinRoundNumB: 7,

			MaxRoundNumA: 10,
			MaxRoundNumB: 12,
		},
	}

	adapter := newTestAdapter(client)

	adapter.StartggSetAdapter.Finals = client.Finals

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireNoError(t, err)

	if len(result) != 1 {
		t.Fatalf(
			"expected 1 set, got %d",
			len(result),
		)
	}

	if !result[0].IsFinals {
		t.Fatal("expected set to be marked as finals")
	}
}

func TestGetSetsData_NotFinals(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test Tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 1,
					},
				},
			},
		},

		sets: map[int64]map[int][]startgg.Nodes{
			100: {
				1: {
					createSet(
						1,
						createParticipant(1, "Player1", "p1"),
						createParticipant(2, "Player2", "p2"),

						// Round НЕ входит в финальный диапазон
						2,

						startgg.State(1),
					),
				},
			},
		},

		Finals: entitySender.StartggFinalConfig{
			FinalBracketId: 100,

			MinRoundNumA: 5,
			MinRoundNumB: 7,

			MaxRoundNumA: 10,
			MaxRoundNumB: 12,
		},
	}

	adapter := newTestAdapter(client)

	adapter.StartggSetAdapter.Finals = client.Finals

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireNoError(t, err)

	if len(result) != 1 {
		t.Fatalf(
			"expected 1 set, got %d",
			len(result),
		)
	}

	if result[0].IsFinals {
		t.Fatal("expected set not to be marked as finals")
	}
}

func TestGetSetsData_DebugMode(t *testing.T) {
	client := &fakeStartggClient{
		tournament: startgg.Tournament{
			Name: "Test Tournament",
		},

		groups: []startgg.PhaseGroupInfo{
			{
				Id: 100,
				Sets: startgg.SetsPageInfo{
					PageInfo: startgg.PageInfo{
						Total: 1,
					},
				},
			},
		},

		sets: map[int64]map[int][]startgg.Nodes{
			100: {
				1: {
					createSet(
						1,
						createParticipant(1, "Player1", "p1"),
						createParticipant(2, "Player2", "p2"),
						1,
						startgg.State(1),
					),
				},
			},
		},
	}

	adapter := newTestAdapter(client)

	adapter.DebugMode = true

	result, err := adapter.GetSetsData(
		context.Background(),
		"tournament/test/event/test",
	)

	testutil.RequireNoError(t, err)

	if len(result) != 1 {
		t.Fatalf(
			"expected 1 set, got %d",
			len(result),
		)
	}

	expectedStates := []int{1, 2, 3}

	if !reflect.DeepEqual(client.lastStates, expectedStates) {
		t.Fatalf(
			"expected states %v, got %v",
			expectedStates,
			client.lastStates,
		)
	}
}
