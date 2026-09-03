package startgg

import (
	"context"

	"fmt"
	"strconv"

	entityStartgg "github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
)

type StartGGBracketProvider struct {
	client *startgg.Client
}

func NewStartGGBracketProvider(client *startgg.Client) *StartGGBracketProvider {
	return &StartGGBracketProvider{
		client: client,
	}
}

func (p *StartGGBracketProvider) GetBracket(ctx context.Context, id string) (*entity.Bracket, error) {
	phaseGroupID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid phase group id: %w", err)
	}

	nodes, err := p.client.GetSetsWithScore(phaseGroupID, 50)
	if err != nil {
		return nil, fmt.Errorf("get sets: %w", err)
	}

	conn, err := p.client.GetConnectionsBracket(phaseGroupID, 50)
	if err != nil {
		return nil, fmt.Errorf("get sets: %w", err)
	}

	bracket := &entity.Bracket{Id: phaseGroupID}
	bracket = generateBracket(bracket, nodes)
	addConnections(bracket, conn)
	return bracket, nil
}

func generateSlot(slots []entityStartgg.Slot, index int) entity.Slot {
	if index >= len(slots) {
		return entity.Slot{}
	}

	slot := slots[index]

	if len(slot.Entrant.Participants) == 0 {
		return entity.Slot{}
	}

	p := slot.Entrant.Participants[0]
	return entity.Slot{
		Id:           slot.Entrant.Id,
		Prefix:       p.Prefix,
		GameNickname: p.GamerTag,
		Score:        slot.Standing.Stats.Score.Value,
	}
}

func generateBracket(bracket *entity.Bracket, data []entityStartgg.Nodes) *entity.Bracket {
	sets := []entity.Set{}

	for _, node := range data {
		set := entity.Set{
			Id:            node.Id,
			State:         int(node.State),
			Stream:        node.Stream.StreamSource,
			FullRoundText: node.FullRoundText,
			Round:         node.Round,
		}

		slotP1 := generateSlot(node.Slots, 0)
		slotP2 := generateSlot(node.Slots, 1)

		set.Slots = []entity.Slot{slotP1, slotP2}

		sets = append(sets, set)
	}

	bracket.Sets = sets

	return bracket
}

func generateSource(source *entityStartgg.EntrantSource) *entity.EntrantSource {
	if source == nil {
		return nil
	}

	if source.Type != "set" || source.TypeID == 0 {
		return nil
	}

	return &entity.EntrantSource{
		Type:      source.Type,
		TypeID:    source.TypeID,
		Condition: source.Condition,
	}
}

func addConnections(bracket *entity.Bracket, conn []entityStartgg.Nodes) {
	setByID := make(map[int64]*entity.Set, len(bracket.Sets))

	for i := range bracket.Sets {
		setByID[bracket.Sets[i].Id] = &bracket.Sets[i]
	}

	for _, node := range conn {
		set, ok := setByID[node.Id]
		if !ok {
			continue
		}
		set.WinnerId = node.WinnerId
		set.Slots[0].Source = generateSource(node.Entrant1Source)
		set.Slots[1].Source = generateSource(node.Entrant2Source)
	}
}
