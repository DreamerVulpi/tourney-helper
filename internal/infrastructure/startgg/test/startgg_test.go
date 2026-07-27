package startgg

import (
	"encoding/json"
	"fmt"
	"testing"

	"os"

	entity "github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
	"github.com/stretchr/testify/assert"
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
	if err != nil {
		assert.Error(t, fmt.Errorf("RunQuery - %w", err))
	}

	expected := &entity.RawPhaseGroupSetsData{
		Data: entity.DataPhaseGroupSets{
			PhaseGroup: entity.PhaseGroupSets{
				Id: 2562129,
				Sets: entity.Sets{
					PageInfo: entity.PageInfo{Total: 9},
					Nodes: []entity.Nodes{
						{
							Id:            77972366,
							State:         3,
							FullRoundText: "Winners Final",
							Round:         3,
							Slots: []entity.Slots{
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
							Id:            77972382,
							State:         3,
							FullRoundText: "Losers Final",
							Round:         -6,
							Slots: []entity.Slots{
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
							Id:            77972381,
							State:         3,
							FullRoundText: "Losers Semi-Final",
							Round:         -5,
							Slots: []entity.Slots{
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
							Id:            77972364,
							State:         3,
							FullRoundText: "Winners Semi-Final",
							Round:         2,
							Slots: []entity.Slots{
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
	if err != nil {
		assert.Error(t, fmt.Errorf("JSON Unmarshal - %w", err))
	}

	assert.Equal(t, expected, actual)
}
