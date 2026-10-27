package startgg

import (
	"encoding/json"
	"fmt"
	"testing"

	"os"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test function GetData using request TestGetPhaseGroupSets
func TestGetData(t *testing.T) {
	variables := map[string]any{
		"phaseGroupId": 2562129,
		"page":         1,
		"perPage":      4,
		"states":       []int{1, 2, 3},
	}

	_, err := json.Marshal(startgg.PrepareQuery(entity.GetPhaseGroupSets, variables))
	if err != nil {
		assert.Error(t, fmt.Errorf("JSON Marshal - %w", err))
	}

	rawData, err := os.ReadFile("rawDataSets.json")
	require.NoError(t, err)

	expected := &entity.RawPhaseGroupSetsData{
		Data: entity.DataPhaseGroupSets{
			PhaseGroup: entity.PhaseGroupSets{
				Id: 2562129,
				Sets: entity.Sets{
					PageInfo: entity.PageInfo{Total: 9},
					Nodes: []entity.Nodes{
						{
							Id:            entity.SetID("77972366"),
							State:         3,
							FullRoundText: "Winners Final",
							Round:         3,
							Slots: []entity.Slot{
								{
									Entrant: entity.Entrant{
										Id: 17340928,
										Participants: []entity.Participant{
											{
												GamerTag: "Pizzduk",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{
														TekkenID: "636h-F3rQ-Hqd2",
													},
												},
												User: entity.User{
													Authorizations: []entity.Authorizations{
														{
															Discord: "pizzduk",
														},
													},
												},
											},
										},
									},
								},
								{
									Entrant: entity.Entrant{
										Id: 17299461,
										Participants: []entity.Participant{
											{
												GamerTag: "Mr_Shadow_",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{},
												},
												User: entity.User{
													Authorizations: []entity.Authorizations{
														{
															Discord: "mr_shadow_",
														},
													},
												},
											},
										},
									},
								},
							},
						},
						{
							Id:            entity.SetID("77972382"),
							State:         3,
							FullRoundText: "Losers Final",
							Round:         -6,
							Slots: []entity.Slot{
								{
									Entrant: entity.Entrant{
										Id: 17340928,
										Participants: []entity.Participant{
											{
												GamerTag: "Pizzduk",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{
														TekkenID: "636h-F3rQ-Hqd2",
													},
												},
												User: entity.User{
													Authorizations: []entity.Authorizations{
														{
															Discord: "pizzduk",
														},
													},
												},
											},
										},
									},
								},
								{
									Entrant: entity.Entrant{
										Id: 17373189,
										Participants: []entity.Participant{
											{
												GamerTag: "cleverdemon",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{},
												},
												User: entity.User{
													Authorizations: nil,
												},
											},
										},
									},
								},
							},
						},
						{
							Id:            entity.SetID("77972381"),
							State:         3,
							FullRoundText: "Losers Semi-Final",
							Round:         -5,
							Slots: []entity.Slot{
								{
									Entrant: entity.Entrant{
										Id: 17327065,
										Participants: []entity.Participant{
											{
												GamerTag: "AlexSouls",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{
														TekkenID: "6624-jt93-MtEE",
													},
												},
												User: entity.User{
													Authorizations: []entity.Authorizations{
														{
															Discord: "alexsouls",
														},
													},
												},
											},
										},
									},
								},
								{
									Entrant: entity.Entrant{
										Id: 17373189,
										Participants: []entity.Participant{
											{
												GamerTag: "cleverdemon",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{},
												},
												User: entity.User{
													Authorizations: nil,
												},
											},
										},
									},
								},
							},
						},
						{
							Id:            entity.SetID("77972364"),
							State:         3,
							FullRoundText: "Winners Semi-Final",
							Round:         2,
							Slots: []entity.Slot{
								{
									Entrant: entity.Entrant{
										Id: 17373189,
										Participants: []entity.Participant{
											{
												GamerTag: "cleverdemon",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{},
												},
												User: entity.User{
													Authorizations: nil,
												},
											},
										},
									},
								},
								{
									Entrant: entity.Entrant{
										Id: 17340928,
										Participants: []entity.Participant{
											{
												GamerTag: "Pizzduk",
												ConnectedAccounts: entity.ConnectedAccounts{
													Tekken: entity.Tekken{
														TekkenID: "636h-F3rQ-Hqd2",
													},
												},
												User: entity.User{
													Authorizations: []entity.Authorizations{
														{
															Discord: "pizzduk",
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	actual := &entity.RawPhaseGroupSetsData{}
	err = json.Unmarshal(rawData, actual)
	require.NoError(t, err)
	assert.Equal(t, expected, actual)
}

func TestNodes_PreviewSetFromJSON(t *testing.T) {
	raw := []byte(`{
		"data": {
			"phaseGroup": {
				"id": 2562129,
				"sets": {
					"pageInfo": {"total": 2},
					"nodes": [
						{"id": 77972366, "state": 3, "fullRoundText": "Winners Final", "round": 3},
						{"id": "preview_3435724_-3_0", "state": 1, "fullRoundText": "Winners Round 1", "round": 1}
					]
				}
			}
		}
	}`)

	var got entity.RawPhaseGroupSetsData
	if err := json.Unmarshal(raw, &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	nodes := got.Data.PhaseGroup.Sets.Nodes
	if len(nodes) != 2 {
		t.Fatalf("nodes len = %d, want 2", len(nodes))
	}

	// real set
	if nodes[0].Id.IsPreview() {
		t.Errorf("nodes[0] unexpectedly preview: %s", nodes[0].Id)
	}
	if id, ok := nodes[0].Id.Numeric(); !ok || id != 77972366 {
		t.Errorf("nodes[0] numeric = (%d,%v), want (77972366,true)", id, ok)
	}

	// preview set
	if !nodes[1].Id.IsPreview() {
		t.Errorf("nodes[1] should be preview: %s", nodes[1].Id)
	}
	if _, ok := nodes[1].Id.Numeric(); ok {
		t.Errorf("nodes[1] Numeric() should be false for preview")
	}
	if nodes[1].Id.String() != "preview_3435724_-3_0" {
		t.Errorf("nodes[1] Id = %q", nodes[1].Id.String())
	}
}
