package startgg

import (
	"context"

	"fmt"
	"strconv"
	"strings"

	entityStartgg "github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widgets"
	"github.com/dreamervulpi/tourney-helper/internal/infrastructure/startgg"
)

// start.gg ограничивает каждый запрос 1000 возвращаемыми объектами.
// Один сет с игроками, стойками, seed'ами и progression-полями — это
// ~20+ объектов, поэтому для тяжёлого запроса держим небольшой perPage.
const (
	widgetSetsPerPage        = 25
	widgetConnectionsPerPage = 50
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

	nodes, err := p.client.GetSetsWithScore(phaseGroupID, widgetSetsPerPage)
	if err != nil {
		return nil, fmt.Errorf("get sets: %w", err)
	}

	conn, info, err := p.client.GetConnectionsBracket(phaseGroupID, widgetConnectionsPerPage)
	if err != nil {
		return nil, fmt.Errorf("get sets: %w", err)
	}

	bracket := &entity.Bracket{Id: phaseGroupID}
	if info.Id != 0 {
		phaseName := ""
		if info.Phase != nil {
			phaseName = info.Phase.Name
		}
		bracket.Label = formatPhaseLabel(
			strings.TrimSpace(phaseName),
			strings.TrimSpace(info.DisplayIdentifier),
			info.Id,
		)
	}
	bracket = generateBracket(bracket, nodes)
	addConnections(bracket, conn)

	return bracket, nil
}

func generateSlot(slots []entityStartgg.WidgetSlot, index int) entity.Slot {
	if index >= len(slots) {
		return entity.Slot{}
	}

	slot := slots[index]

	if slot.Entrant == nil {
		return entity.Slot{}
	}

	if len(slot.Entrant.Participants) == 0 {
		return entity.Slot{}
	}

	p := slot.Entrant.Participants[0]

	var score int
	if slot.Standing != nil {
		score = slot.Standing.Stats.Score.Value
	}

	return entity.Slot{
		Id:           slot.Entrant.Id,
		Prefix:       p.Prefix,
		GameNickname: p.GamerTag,
		Score:        score,
	}
}

func generateBracket(bracket *entity.Bracket, data []entityStartgg.WidgetSetNode) *entity.Bracket {
	sets := []entity.Set{}
	seedToSetLabel := buildSeedToSetLabel(data)

	for _, node := range data {
		set := entity.Set{
			Id:            startgg.RawMessageToString(node.Id),
			State:         int(node.State),
			Stream:        node.Stream.StreamSource,
			FullRoundText: node.FullRoundText,
			Round:         node.Round,
			Progressions:  buildProgressions(node, bracket.Id, seedToSetLabel),
		}

		slotP1 := generateSlot(node.Slots, 0)
		slotP2 := generateSlot(node.Slots, 1)

		set.Slots = []entity.Slot{slotP1, slotP2}

		sets = append(sets, set)
	}

	bracket.Sets = sets

	return bracket
}

// buildSeedToSetLabel maps a progression seed id to the full round text of the
// set that contains this seed. This lets us resolve transitions inside the
// same phase group (for example, Winners Final -> Grand Final).
func buildSeedToSetLabel(data []entityStartgg.WidgetSetNode) map[string]string {
	result := make(map[string]string)

	for _, set := range data {
		for _, slot := range set.Slots {
			if slot.Seed == nil {
				continue
			}

			seedID := startgg.RawMessageToString(slot.Seed.Id)
			if seedID == "" {
				continue
			}

			result[seedID] = set.FullRoundText
		}
	}

	return result
}

func buildProgressions(
	node entityStartgg.WidgetSetNode,
	currentPhaseGroupID int64,
	seedToSetLabel map[string]string,
) []entity.ProgressionTarget {
	targets := make([]entity.ProgressionTarget, 0, 2)

	appendTarget := func(side string, seed *entityStartgg.WidgetProgressionSeed) {
		if seed == nil {
			return
		}

		seedID := startgg.RawMessageToString(seed.Id)

		target := entity.ProgressionTarget{
			Side: side,
		}

		if seed.PhaseGroup != nil {
			target.PhaseGroupID = seed.PhaseGroup.Id
			target.DisplayIdentifier = strings.TrimSpace(seed.PhaseGroup.DisplayIdentifier)
			if seed.PhaseGroup.Phase != nil {
				target.PhaseName = strings.TrimSpace(seed.PhaseGroup.Phase.Name)
			}
		}

		samePhaseGroup := seed.PhaseGroup != nil &&
			seed.PhaseGroup.Id == currentPhaseGroupID

		if seed.PhaseGroup == nil || samePhaseGroup {
			// Destination is inside the current phase group — resolve the
			// destination set name (e.g. "Grand Final", "Losers Final").
			label := seedToSetLabel[seedID]
			if label == "" || label == node.FullRoundText {
				return
			}
			target.Label = label
		} else {
			target.Label = progressionLabel(target)
		}

		if target.Label == "" {
			return
		}

		targets = append(targets, target)
	}

	appendTarget("winner", node.WinnerProgressionSeed)
	appendTarget("loser", node.LoserProgressionSeed)

	return targets
}

func progressionLabel(p entity.ProgressionTarget) string {
	return formatPhaseLabel(p.PhaseName, p.DisplayIdentifier, p.PhaseGroupID)
}

func formatPhaseLabel(phaseName, displayIdentifier string, phaseGroupID int64) string {
	// Числовой displayIdentifier (например "1" у единственной группы)
	// не добавляет полезной информации к названию фазы.
	showIdentifier := displayIdentifier != ""
	if showIdentifier {
		if _, err := strconv.Atoi(displayIdentifier); err == nil {
			showIdentifier = false
		}
	}

	switch {
	case phaseName != "" && showIdentifier:
		return fmt.Sprintf("%s (%s)", phaseName, displayIdentifier)
	case phaseName != "":
		return phaseName
	case displayIdentifier != "":
		return displayIdentifier
	default:
		return fmt.Sprintf("Phase group %d", phaseGroupID)
	}
}

func generateSource(source *entityStartgg.WidgetEntrantSource) *entity.EntrantSource {
	if source == nil {
		return nil
	}

	typeId := startgg.RawMessageToString(source.TypeID)

	if source.Type != "set" || typeId == "" {
		return nil
	}

	return &entity.EntrantSource{
		Type:      source.Type,
		TypeID:    typeId,
		Condition: source.Condition,
	}
}

func addConnections(bracket *entity.Bracket, conn []entityStartgg.WidgetSetNode) {
	setByID := make(map[string]*entity.Set, len(bracket.Sets))

	for i := range bracket.Sets {
		setByID[bracket.Sets[i].Id] = &bracket.Sets[i]
	}

	for _, node := range conn {
		set, ok := setByID[startgg.RawMessageToString(node.Id)]
		if !ok {
			fmt.Printf(
				"CONNECTION SET NOT FOUND: id=%d round=%d\n",
				node.Id,
				node.Round,
			)
			continue
		}

		fmt.Printf(
			"ADD CONNECTION: set=%v round=%d slots=%d winner=%d source1=%+v source2=%+v\n",
			set.Id,
			set.Round,
			len(set.Slots),
			node.WinnerId,
			node.Entrant1Source,
			node.Entrant2Source,
		)

		set.WinnerId = node.WinnerId

		if len(set.Slots) < 2 {
			fmt.Printf(
				"WARNING: set=%v has only %d slots\n",
				set.Id,
				len(set.Slots),
			)
			continue
		}

		set.Slots[0].Source = generateSource(node.Entrant1Source)
		set.Slots[1].Source = generateSource(node.Entrant2Source)
	}
}
