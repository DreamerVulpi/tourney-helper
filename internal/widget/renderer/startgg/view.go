package startgg

import (
	"fmt"
	"sort"
	"strings"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func classifySection(set entity.Set) string {
	text := set.FullRoundText

	// Grand Final
	if strings.HasPrefix(text, "Grand Final") {
		return "final"
	}

	// Плейсмент-матчи (5th Place Tiebreak, 7th Place Tiebreak и т.п.)
	if strings.Contains(text, "Place") || strings.Contains(text, "Tiebreak") {
		return "placement"
	}

	// Losers Bracket
	if strings.HasPrefix(text, "Losers") {
		return "losers"
	}

	// Winners Bracket
	if strings.HasPrefix(text, "Winners") {
		return "winners"
	}

	// Fallback по знаку round
	if set.Round > 0 {
		return "winners"
	}
	if set.Round < 0 {
		return "losers"
	}

	// Round == 0 — обычно bye-сеты в winners
	return "winners"
}

func (r *StartGGRenderer) buildView(bracket *entity.Bracket) entity.BracketView {
	view := entity.BracketView{
		Id:   bracket.Id,
		Sets: make([]entity.SetView, 0, len(bracket.Sets)),
	}

	// Присваиваем позиции ДО создания view
	assignPositions(bracket)
	debugBracketStructure(bracket)

	for _, set := range bracket.Sets {
		section := classifySection(set)

		// Пропускаем плейсмент-матчи (5th Place Tiebreak и т.п.)
		if section == "placement" {
			continue
		}

		setView := buildSetView(set)
		setView.Section = section

		// Для Grand Final используем фиктивный round, чтобы он всегда был крайним справа
		if section == "final" {
			setView.Round = 999
		} else {
			setView.Round = set.Round
		}

		view.Sets = append(view.Sets, setView)
	}

	view.Connections = buildConnections(bracket)

	// Отладка
	logger.Log(entityLogger.Debug, fmt.Sprintf("Connections count: %d", len(view.Connections)))

	return view
}

func buildSetView(set entity.Set) entity.SetView {
	view := entity.SetView{
		Id:            set.Id,
		State:         set.State,
		Stream:        set.Stream,
		Position:      set.Position,
		FullRoundText: set.FullRoundText,
		Players:       make([]entity.PlayerView, 0, len(set.Slots)),
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

func buildConnections(bracket *entity.Bracket) []entity.ConnectionView {
	var connections []entity.ConnectionView

	// Строим соединения
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
				fmt.Printf(
					"SOURCE SET NOT FOUND: toSet=%d sourceSet=%d condition=%s\n",
					toSet.Id, source.TypeID, source.Condition,
				)
				continue
			}

			fromSlotIndex := findSourceSlot(fromSet, source.Condition)

			if fromSlotIndex < 0 {
				fmt.Printf(
					"INVALID SOURCE SLOT: fromSet=%d toSet=%d condition=%s\n",
					fromSet.Id, toSet.Id, source.Condition,
				)
				continue
			}

			connections = append(connections, entity.ConnectionView{
				FromSetID: fromSet.Id,
				ToSetID:   toSet.Id,
				FromSlot:  fromSlotIndex,
				ToSlot:    toSlotIndex,
				Condition: source.Condition,
			})
		}
	}

	return connections
}

func assignPositions(bracket *entity.Bracket) {
	// Группируем сеты по секциям и раундам
	type SetGroup struct {
		Section string
		Round   int
		Sets    []*entity.Set
	}

	groups := make(map[string]*SetGroup)

	for i := range bracket.Sets {
		set := &bracket.Sets[i]

		// Определяем секцию
		section := "winners"
		if strings.HasPrefix(set.FullRoundText, "Grand Final") && set.Round > 0 {
			section = "final"
		} else if set.Round < 0 {
			section = "losers"
		}

		key := fmt.Sprintf("%s_%d", section, set.Round)

		if groups[key] == nil {
			groups[key] = &SetGroup{
				Section: section,
				Round:   set.Round,
				Sets:    []*entity.Set{},
			}
		}

		groups[key].Sets = append(groups[key].Sets, set)
	}

	// Присваиваем позиции в каждой группе
	for _, group := range groups {
		// Сортируем по ID
		sort.Slice(group.Sets, func(i, j int) bool {
			return group.Sets[i].Id < group.Sets[j].Id
		})

		// Присваиваем позиции
		for i, set := range group.Sets {
			set.Position = i + 1
		}
	}
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

func debugBracketStructure(bracket *entity.Bracket) {
	fmt.Println("=== BRACKET STRUCTURE ===")

	roundsMap := make(map[int][]entity.Set)
	for _, set := range bracket.Sets {
		roundsMap[set.Round] = append(roundsMap[set.Round], set)
	}

	var roundNumbers []int
	for round := range roundsMap {
		roundNumbers = append(roundNumbers, round)
	}
	sort.Ints(roundNumbers)

	for _, roundNum := range roundNumbers {
		sets := roundsMap[roundNum]
		fmt.Printf("Round %d: %d sets\n", roundNum, len(sets))

		// Сортируем по позиции для отображения
		sort.Slice(sets, func(i, j int) bool {
			return sets[i].Position < sets[j].Position
		})

		for _, set := range sets {
			fmt.Printf("  Pos %d: Set %d (ID: %d)\n", set.Position, set.Id, set.Id)

			// Выводим источники
			for i, slot := range set.Slots {
				if slot.Source != nil && slot.Source.Type == "set" {
					sourceSet, ok := findSetByID(bracket.Sets, slot.Source.TypeID)
					sourceRound := 0
					if ok {
						sourceRound = sourceSet.Round
					}
					fmt.Printf("    Slot %d: from Set %d (Round %d, Pos %d) [%s]\n",
						i, slot.Source.TypeID, sourceRound, sourceSet.Position, slot.Source.Condition)
				}
			}
		}
	}
}
