package sender

import (
	"context"
	"fmt"
	"log"
	"math"
	"regexp"
	"strconv"

	"encoding/csv"
	"errors"
	"os"
	"strings"

	"github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	entityStartgg "github.com/dreamervulpi/tourneyBot/internal/entity/startgg"
	"github.com/dreamervulpi/tourneyBot/internal/infrastructure/startgg"
)

var startggTemplateSlug = regexp.MustCompile(`tournament/[^/]+/event/[^/]+`)

type StartggSetAdapter struct {
	sender.StartggSetAdapter
}

// TODO: Check empty fields
func NewStartggAdapter(client *startgg.Client, messengerName string, url string, debug bool, game string, contacts map[string]sender.Participant) *StartggSetAdapter {
	return &StartggSetAdapter{
		StartggSetAdapter: sender.StartggSetAdapter{
			Client:        client,
			UrlToEvent:    url,
			MessengerName: messengerName,
			DebugMode:     debug,
			Contacts:      contacts,
			Game:          game,
		},
	}
}

// Get discord contacts from CSV file Startgg
func LoadCSV(nameFile string) (map[string]sender.Participant, error) {
	if nameFile == "" {
		return nil, errors.New("loadCSV: filename is empty")
	}

	log.Println(nameFile)

	f, err := os.Open(nameFile)
	if err != nil {
		return map[string]sender.Participant{}, fmt.Errorf("loadCSV: open file, %v", err)
	}
	defer f.Close() //nolint:errcheck

	csvReader := csv.NewReader(f)
	records, err := csvReader.ReadAll()
	if err != nil {
		return map[string]sender.Participant{}, fmt.Errorf("loadCSV: read CSV, %v", err)
	}

	if len(records) == 0 {
		return map[string]sender.Participant{}, fmt.Errorf("loadCSV: 0 records CSV, %v", err)
	}

	// Search index for get data
	var idxDiscordColumn, idxGamerTagColumn, idxConnectColumn int
	for index, column := range records[0] {
		if strings.Contains(column, "Discord!") {
			idxDiscordColumn = index
		}
		if column == "Short GamerTag" {
			idxGamerTagColumn = index
		}
		if column == "Connect" {
			idxConnectColumn = index
		}
	}

	contacts := make(map[string]sender.Participant, len(records)-1)
	for i := 1; i < len(records); i++ {
		attendee := records[i]

		if len(attendee) <= idxDiscordColumn || len(attendee) <= idxConnectColumn {
			continue
		}

		var discordLogin string
		if val := attendee[idxDiscordColumn]; val != "" {
			discordLogin = val
		}

		var gameID string
		if val := attendee[idxConnectColumn]; val != "" {
			rawGameID := strings.Split(attendee[idxConnectColumn], " ")
			if len(rawGameID) >= 2 {
				gameID = strings.ReplaceAll(rawGameID[1], ",", "")
			}
		}

		var gameNickname string
		if val := attendee[idxGamerTagColumn]; val != "" {
			gameNickname = val
		}

		if gameID == "" {
			gameID = "N/D"
		}
		if gameNickname == "" {
			gameNickname = "N/D"
		}
		if discordLogin == "" {
			discordLogin = "N/D"
		}

		key := attendee[idxGamerTagColumn]
		if key != "" {
			contacts[key] = sender.Participant{
				MessenagerLogin: discordLogin,
				MessenagerName:  "Discord",
				GameID:          gameID,
				GameNickname:    gameNickname,
			}
		}
	}

	return contacts, nil
}

func (s *StartggSetAdapter) GetPlatformTournamentName() string {
	return "Startgg"
}

func (s *StartggSetAdapter) GetTournamentSlug() (string, error) {
	log.Printf("DEBUG: GetTournamentSlug called with URL: '%s'", s.UrlToEvent)
	slug := startggTemplateSlug.FindString(s.UrlToEvent)

	if slug == "" {
		return "", fmt.Errorf("GetTournamentSlug | Startgg | incorrect format url")
	}

	return slug, nil
}

func (s *StartggSetAdapter) GetSetsData(ctx context.Context) ([]sender.SetData, error) {
	slug, err := s.GetTournamentSlug()
	if err != nil {
		return nil, err
	}

	tournament, err := s.Client.GetTournament(strings.Split(slug, "/")[1])
	if err != nil {
		return nil, fmt.Errorf("GetSetsData | Startgg | get tournament error: %w", err)
	}

	phaseGroups, err := s.Client.GetListGroups(slug)
	if err != nil {
		return nil, fmt.Errorf("GetSetsData | Startgg | get groups error: %w", err)
	}

	states := []int{1}
	if s.DebugMode {
		states = []int{1, 2, 3}
	}

	var setsData []sender.SetData

	for _, phaseGroupId := range phaseGroups {
		total, err := s.Client.GetPagesCount(phaseGroupId.Id, states)
		if err != nil || total == 0 {
			continue
		}

		var pages int
		if total <= 60 {
			pages = 1
		} else {
			pages = int(math.Ceil(float64(total) / 60.0))
		}

		log.Printf("GetSetsData | Startgg | %v | %v | Pages: %v\n", phaseGroupId, total, pages)

		for i := 0; i < pages; i++ {
			sets, err := s.Client.GetSets(phaseGroupId.Id, i+1, 60, states)
			if err != nil {
				log.Printf("GetSetsData | Startgg | Can't get data of sets: %v", err)
				continue
			}

			for _, set := range sets {
				if ctx.Err() != nil {
					break
				}

				if len(set.Slots[0].Entrant.Participants) == 0 || len(set.Slots[1].Entrant.Participants) == 0 {
					log.Printf("GetSetsData | Startgg | No contact data from platform")
					continue
				}

				p1 := s.ConvertContacts(set.Slots[0].Entrant.Participants[0])
				p2 := s.ConvertContacts(set.Slots[1].Entrant.Participants[0])

				isFinals := false
				if s.Finals.FinalBracketId == phaseGroupId.Id {
					round := set.Round
					if s.Finals.MinRoundNumA <= round && round <= s.Finals.MinRoundNumB || s.Finals.MaxRoundNumA <= round && round <= s.Finals.MaxRoundNumB {
						isFinals = true
					}
				}

				log.Printf("GetSetsData | Startgg | Tournament name: %v", tournament.Name)
				set := sender.SetData{
					TournamentName: tournament.Name,
					SetID:          set.Id,
					StreamName:     set.Stream.StreamName,
					StreamSourse:   set.Stream.StreamSource,
					RoundNum:       set.Round,
					PhaseGroupId:   phaseGroupId.Id,
					ContactPlayer1: p1,
					ContactPlayer2: p2,
					IsFinals:       isFinals,
					FullInviteLink: fmt.Sprint("https://www.start.gg/", slug, "/set/", set.Id),
				}
				setsData = append(setsData, set)
			}
			log.Printf("GetSetsData | Startgg | Checked phaseGroup (%v)", phaseGroupId)
		}
	}
	return setsData, nil
}

func (s *StartggSetAdapter) ConvertContacts(data entityStartgg.Participant) sender.Participant {
	p := sender.Participant{
		GameNickname:            data.GamerTag,
		MessenagerName:          s.MessengerName,
		TournamentPlatformName:  s.GetPlatformTournamentName(),
		TournamentPlatformID:    strconv.FormatInt(data.User.ID, 10),
		TournamentPlatformLogin: data.GamerTag,
	}

	if len(data.User.Authorizations) > 0 {
		p.MessenagerLogin = data.User.Authorizations[0].Discord
	} else {
		p.MessenagerLogin = "N/D"
	}

	gameLower := strings.ToLower(s.Game)
	if strings.Contains(gameLower, "tekken") {
		p.GameID = data.ConnectedAccounts.Tekken.TekkenID
		p.GameName = "Tekken8"
	} else if strings.Contains(gameLower, "sf6") || strings.Contains(gameLower, "street") {
		p.GameID = data.ConnectedAccounts.SF6.GameID
		p.GameName = "SF6"
	}

	if p.GameID == "" || p.MessenagerLogin == "" || p.GameNickname == "" || p.MessenagerID == "" {
		if val, ok := s.Contacts[strings.ToLower(data.GamerTag)]; ok {
			if p.GameID == "" {
				p.GameID = val.GameID
				p.GameName = val.GameName
			}
			if p.MessenagerLogin == "" {
				p.MessenagerLogin = val.MessenagerLogin
			}
			if p.GameNickname == "" {
				p.GameNickname = val.GameNickname
			}
			if p.MessenagerID == "" {
				p.MessenagerID = val.MessenagerID
			}
		}
	}

	if p.GameID == "" {
		p.GameID = "N/D"
	}
	if p.GameName == "" {
		p.GameName = "N/D"
	}
	if p.MessenagerLogin == "" {
		p.MessenagerLogin = "N/D"
	}
	if p.MessenagerID == "" {
		p.MessenagerID = "N/D"
	}

	log.Printf("ConvertContacts - Object: %v", p)
	return p
}
