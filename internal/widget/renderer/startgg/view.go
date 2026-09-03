package startgg

import (
	"fmt"
	"strings"

	"sort"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func (r *StartGGRenderer) buildView(bracket *entity.Bracket) entity.BracketView {
	view := entity.BracketView{
		Id: bracket.Id,
	}

	winners := make(map[int]*entity.RoundView)
	losers := make(map[int]*entity.RoundView)

	for _, set := range bracket.Sets {
		switch {
		case strings.HasPrefix(set.FullRoundText, "Grand Final"):
			view.Final = append(view.Final, buildSetView(set))
		case set.Round > 0:
			addSetToRound(winners, set)
		case set.Round < 0:
			addSetToRound(losers, set)
		}
	}

	view.Winners = sortRounds(winners)
	view.Losers = sortRounds(losers)
	view.Connections = buildConnections(bracket)

	logger.Log(
		entityLogger.Debug,
		fmt.Sprintf("Connections count: %d", len(view.Connections)),
	)

	for i, conn := range view.Connections {
		logger.Log(
			entityLogger.Debug,
			fmt.Sprintf(
				"Connection[%d]: %d[%d] -> %d[%d] condition=%s",
				i,
				conn.FromSetID,
				conn.FromSlot,
				conn.ToSetID,
				conn.ToSlot,
				conn.Condition,
			),
		)
	}

	return view
}

func buildSetView(set entity.Set) entity.SetView {
	view := entity.SetView{
		Id:      set.Id,
		State:   set.State,
		Stream:  set.Stream,
		Players: make([]entity.PlayerView, 0, len(set.Slots)),
	}

	for i, slot := range set.Slots {
		view.Players = append(view.Players, entity.PlayerView{
			Slot:     i,
			Prefix:   slot.Prefix,
			Nickname: slot.GameNickname,
			Score:    slot.Score,
		})
	}

	return view
}

func addSetToRound(rounds map[int]*entity.RoundView, set entity.Set) {
	round, exists := rounds[set.Round]

	if !exists {
		round = &entity.RoundView{
			Name:  set.FullRoundText,
			Round: set.Round,
			Sets:  make([]entity.SetView, 0),
		}

		rounds[set.Round] = round
	}

	round.Sets = append(
		round.Sets,
		buildSetView(set),
	)
}

func sortRounds(rounds map[int]*entity.RoundView) []entity.RoundView {
	result := make([]entity.RoundView, 0, len(rounds))

	for _, round := range rounds {
		result = append(result, *round)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Round < result[j].Round
	})

	return result
}

func buildConnections(bracket *entity.Bracket) []entity.ConnectionView {
	var connections []entity.ConnectionView

	for _, toSet := range bracket.Sets {
		for toSlotIndex, slot := range toSet.Slots {
			source := slot.Source

			if source == nil {
				continue
			}

			if source.Type != "set" || source.TypeID == 0 {
				continue
			}

			fromSet, ok := findSetByID(bracket.Sets, source.TypeID)
			if !ok {
				continue
			}

			fromSlotIndex := findSourceSlot(
				fromSet,
				source.Condition,
			)

			if fromSlotIndex == -1 {
				continue
			}

			connections = append(connections, entity.ConnectionView{
				FromSetID: fromSet.Id,
				ToSetID:   toSet.Id,

				FromSlot: fromSlotIndex,
				ToSlot:   toSlotIndex,

				Condition: source.Condition,
			})
		}
	}

	return connections
}

func findSetByID(sets []entity.Set, id int64) (entity.Set, bool) {
	for _, set := range sets {
		if set.Id == id {
			return set, true
		}
	}

	return entity.Set{}, false
}

func findSourceSlot(set entity.Set, condition string) int {
	switch condition {

	case "winner":
		for i, slot := range set.Slots {
			if slot.Id == set.WinnerId {
				return i
			}
		}

	case "loser":
		for i, slot := range set.Slots {
			if slot.Id != set.WinnerId {
				return i
			}
		}
	}

	return -1
}
