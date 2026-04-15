package sender

import (
	"context"
	"fmt"
	"log"
	"math"
	"regexp"

	"encoding/csv"
	"errors"
	"os"
	"strings"

	"github.com/dreamervulpi/tourneyBot/internal/entity/sender"
	entityStartgg "github.com/dreamervulpi/tourneyBot/internal/entity/startgg"
	"github.com/dreamervulpi/tourneyBot/internal/infrastructure/startgg"

	"github.com/dreamervulpi/tourneyBot/internal/auth"
)

type StartggFinalConfig struct {
	FinalBracketId int64
	MinRoundNumA   int
	MinRoundNumB   int
	MaxRoundNumA   int
	MaxRoundNumB   int
}

type StartggSetAdapter struct {
	Client     *startgg.Client
	UrlToEvent string
	Slug       string
	Game       string
	Finals     StartggFinalConfig
	DebugMode  bool
	TestUser   sender.Participant
	Contacts   map[string]sender.Participant
}

var startggTemplateSlug = regexp.MustCompile(`tournament/[^/]+/event/[^/]+`)

func (_ StartggSetAdapter) GetMe(tourneyAuth *auth.AuthClient) (auth.Identity, error) {
	ctx := context.Background()
	user, err := tourneyAuth.GetStartGGMe(ctx)
	if err != nil {
		return auth.Identity{}, err
	}
	return *user, nil
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

		discordLogin := "N/D"
		if val := attendee[idxDiscordColumn]; val != "" {
			discordLogin = val
		}

		gameID := "N/D"
		if val := attendee[idxConnectColumn]; val != "" {
			rawGameID := strings.Split(attendee[idxConnectColumn], " ")
			if len(rawGameID) >= 2 {
				gameID = strings.ReplaceAll(rawGameID[1], ",", "")
			}
		}

		gameNickname := "N/D"
		if val := attendee[idxGamerTagColumn]; val != "" {
			gameNickname = val
		}

		key := attendee[idxGamerTagColumn]
		if key != "" {
			contacts[key] = sender.Participant{
				MessenagerLogin: discordLogin,
				MessenagerName:  "discord",
				GameID:          gameID,
				GameNickname:    gameNickname,
			}
		}
	}

	return contacts, nil
}

func (s StartggSetAdapter) GetPlatformTournamentName() string {
	return "startgg"
}

func (s StartggSetAdapter) GetTournamentSlug() (string, error) {
	slug := startggTemplateSlug.FindString(s.UrlToEvent)

	if slug == "" {
		return "", fmt.Errorf("GetTournamentSlug | Startgg | incorrect format url")
	}

	return slug, nil
}

func (s StartggSetAdapter) GetSetsData(ctx context.Context) ([]sender.SetData, error) {
	slug, err := s.GetTournamentSlug()
	if err != nil {
		return nil, err
	}

	tournament, err := s.Client.GetTournament(slug)
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
		MessenagerLogin: "N/D",
		GameID:          "N/D",
		GameNickname:    "N/D",
	}

	if len(data.User.Authorizations) > 0 {
		p.MessenagerLogin = data.User.Authorizations[0].Discord
	} else {
		p.MessenagerLogin = "N/D"
	}

	// TODO: Support other games (SF6 and etc...)
	// switch s.cfg.tournament.Game.Name {
	// case "tekken":
	// 	gameID = src.ConnectedAccounts.Tekken.TekkenID
	// case "sf6":
	// 	gameID = src.ConnectedAccounts.SF6.GameID
	// }
	gameID := data.ConnectedAccounts.Tekken.TekkenID
	if gameID != "" {
		p.GameID = gameID
	} else {
		if val, ok := s.Contacts[strings.ToLower(data.GamerTag)]; ok {
			p.GameID = val.GameID
		} else {
			p.GameID = "N/D"
		}

	}

	gameNickname := data.GamerTag
	if gameNickname != "" {
		p.GameNickname = gameNickname
	} else {
		if val, ok := s.Contacts[strings.ToLower(data.GamerTag)]; ok {
			p.GameNickname = val.GameNickname
		} else {
			p.GameNickname = "N/D"
		}
	}

	return p
}
