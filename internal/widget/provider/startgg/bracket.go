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

	nodes, err := p.client.GetSetsWithScore(phaseGroupID, 1, 50)
	if err != nil {
		return nil, fmt.Errorf("get sets: %w", err)
	}

	bracket := &entity.Bracket{Id: phaseGroupID}
	return generateBracket(bracket, nodes), nil
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
		Prefix:       p.Prefix,
		GameNickname: p.GamerTag,
		Score:        slot.Standing.Stats.Score.Value,
	}
}

func generateBracket(bracket *entity.Bracket, data []entityStartgg.Nodes) *entity.Bracket {
	sets := []entity.Set{}

	for _, node := range data {
		set := entity.Set{}
		set.State = int(node.State)
		set.Stream = node.Stream.StreamSource
		set.FullRountText = node.FullRoundText
		set.Round = node.Round
		slotP1 := generateSlot(node.Slots, 0)
		slotP2 := generateSlot(node.Slots, 1)
		set.Slots = []entity.Slot{slotP1, slotP2}
		sets = append(sets, set)
	}

	bracket.Sets = sets
	return bracket
}
