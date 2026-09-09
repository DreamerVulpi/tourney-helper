package startgg

import (
	"fmt"
	"sort"
	"strings"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widget"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

func (r *StartGGRenderer) buildView(bracket *entity.Bracket) entity.BracketView {
	view := entity.BracketView{
		Id: bracket.Id,
	}

	// Присваиваем позиции ДО создания view
	assignPositions(bracket)
	debugBracketStructure(bracket)

	winners := make(map[int]*entity.RoundView)
	losers := make(map[int]*entity.RoundView)

	for _, set := range bracket.Sets {
		isGrandFinal := strings.HasPrefix(set.FullRoundText, "Grand Final") && set.Round > 0
		switch {
		case isGrandFinal:
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

	// Отладка
	logger.Log(entityLogger.Debug, fmt.Sprintf("Connections count: %d", len(view.Connections)))

	for i, conn := range view.Connections {
		logger.Log(entityLogger.Debug, fmt.Sprintf(
			"Connection[%d]: %d[%d] -> %d[%d] condition=%s",
			i, conn.FromSetID, conn.FromSlot, conn.ToSetID, conn.ToSlot, conn.Condition,
		))
	}

	return view
}

func buildSetView(set entity.Set) entity.SetView {
	view := entity.SetView{
		Id:       set.Id,
		State:    set.State,
		Stream:   set.Stream,
		Players:  make([]entity.PlayerView, 0, len(set.Slots)),
		Position: set.Position,
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

	round.Sets = append(round.Sets, buildSetView(set))
}

func sortRounds(rounds map[int]*entity.RoundView) []entity.RoundView {
	result := make([]entity.RoundView, 0, len(rounds))

	for _, round := range rounds {
		// Сортируем сеты внутри раунда по позиции
		sort.Slice(round.Sets, func(i, j int) bool {
			return round.Sets[i].Position < round.Sets[j].Position
		})
		result = append(result, *round)
	}

	sort.Slice(result, func(i, j int) bool {
		// Для Winners (положительные номера) - по возрастанию
		if result[i].Round > 0 && result[j].Round > 0 {
			return result[i].Round < result[j].Round
		}
		// Для Losers (отрицательные номера) - от большего к меньшему
		// -4 (ранний) -> -5 -> -6 -> ... -> -12 (поздний)
		if result[i].Round < 0 && result[j].Round < 0 {
			return result[i].Round > result[j].Round
		}
		// Winners перед Losers
		return result[i].Round > result[j].Round
	})

	return result
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
	// Сначала присваиваем позиции для Winners Bracket
	assignWinnersPositions(bracket)

	// Затем для Losers Bracket
	assignLosersPositions(bracket)
}

func assignWinnersPositions(bracket *entity.Bracket) {
	// Группируем Winners сеты по раундам
	winnersRounds := make(map[int][]*entity.Set)
	for i := range bracket.Sets {
		set := &bracket.Sets[i]
		if set.Round > 0 {
			winnersRounds[set.Round] = append(winnersRounds[set.Round], set)
		}
	}

	// Сортируем раунды
	var roundNumbers []int
	for round := range winnersRounds {
		roundNumbers = append(roundNumbers, round)
	}
	sort.Ints(roundNumbers)

	// Присваиваем позиции последовательно
	for _, roundNum := range roundNumbers {
		sets := winnersRounds[roundNum]

		if roundNum == 1 {
			// Первый раунд: просто по порядку ID
			sort.Slice(sets, func(i, j int) bool {
				return sets[i].Id < sets[j].Id
			})
			for i, set := range sets {
				set.Position = i + 1
			}
		} else {
			// Для остальных раундов используем позиции источников
			assignPositionsBySources(sets, bracket)
		}
	}
}

func assignLosersPositions(bracket *entity.Bracket) {
	// Группируем Losers сеты по раундам
	losersRounds := make(map[int][]*entity.Set)
	for i := range bracket.Sets {
		set := &bracket.Sets[i]
		if set.Round < 0 {
			losersRounds[set.Round] = append(losersRounds[set.Round], set)
		}
	}

	// Сортируем раунды (от большего отрицательного к меньшему)
	var roundNumbers []int
	for round := range losersRounds {
		roundNumbers = append(roundNumbers, round)
	}
	sort.Sort(sort.Reverse(sort.IntSlice(roundNumbers)))

	// Присваиваем позиции последовательно
	for _, roundNum := range roundNumbers {
		sets := losersRounds[roundNum]

		if roundNum == -4 {
			// Первый раунд Losers: используем позиции из Winners Round 2
			assignLosersFirstRoundPositions(sets, bracket)
		} else {
			// Для остальных раундов используем позиции источников
			assignPositionsBySources(sets, bracket)
		}
	}
}

func assignLosersFirstRoundPositions(sets []*entity.Set, bracket *entity.Bracket) {
	// Для каждого сета в Losers Round -4 находим позицию проигравшего из Winners Round 2
	for _, set := range sets {
		minPosition := len(sets) + 1
		hasSource := false

		for _, slot := range set.Slots {
			if slot.Source != nil && slot.Source.Type == "set" && slot.Source.TypeID != 0 {
				sourceSet, ok := findSetByID(bracket.Sets, slot.Source.TypeID)
				if ok && sourceSet.Position > 0 {
					if sourceSet.Position < minPosition {
						minPosition = sourceSet.Position
					}
					hasSource = true
				}
			}
		}

		if hasSource {
			set.Position = minPosition
		}
	}

	// Сортируем по позиции
	sort.Slice(sets, func(i, j int) bool {
		if sets[i].Position == 0 && sets[j].Position == 0 {
			return sets[i].Id < sets[j].Id
		}
		if sets[i].Position == 0 {
			return false
		}
		if sets[j].Position == 0 {
			return true
		}
		return sets[i].Position < sets[j].Position
	})

	// Перенумеровываем позиции
	for i, set := range sets {
		set.Position = i + 1
	}
}

func assignPositionsBySources(sets []*entity.Set, bracket *entity.Bracket) {
	// Создаем карту: setID -> минимальная позиция источника
	positionMap := make(map[int64]int)

	for _, set := range sets {
		minPosition := len(sets) + 1
		hasSource := false

		for _, slot := range set.Slots {
			if slot.Source != nil && slot.Source.Type == "set" && slot.Source.TypeID != 0 {
				sourceSet, ok := findSetByID(bracket.Sets, slot.Source.TypeID)
				if ok && sourceSet.Position > 0 && sourceSet.Position < minPosition {
					minPosition = sourceSet.Position
					hasSource = true
				}
			}
		}

		if hasSource {
			positionMap[set.Id] = minPosition
		}
	}

	// Сортируем сеты
	sort.Slice(sets, func(i, j int) bool {
		posI, hasI := positionMap[sets[i].Id]
		posJ, hasJ := positionMap[sets[j].Id]

		if hasI && hasJ {
			if posI != posJ {
				return posI < posJ
			}
		} else if hasI {
			return true
		} else if hasJ {
			return false
		}

		return sets[i].Id < sets[j].Id
	})

	// Присваиваем позиции
	for i, set := range sets {
		set.Position = i + 1
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
