package startgg

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"

	"encoding/csv"
	"strconv"
	"strings"

	"time"

	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/metrics"
)

type Client struct {
	httpClient *http.Client
	Metrics    *metrics.Collector
}

func NewClient(clt *http.Client) *Client {
	return &Client{
		httpClient: clt,
	}
}

func PrepareQuery(query string, variables map[string]interface{}) map[string]interface{} {
	return map[string]interface{}{
		"query":     query,
		"variables": variables,
	}
}

func validateData(data []byte) (string, error) {
	results := &startgg.FailedCall{}

	err := json.Unmarshal(data, results)
	if err != nil {
		return "", errors.New("unable To Validate Data")
	}

	return results.Message, nil
}

// Execute query for get raw data
func (c *Client) RunQuery(query []byte) ([]byte, error) {
	start := time.Now()

	var err error
	defer func() {
		if c.Metrics != nil {
			c.Metrics.RecordAPIRequest(err, time.Since(start))
		}
	}()

	// Creates the POST request and checks for errors.
	req, err := http.NewRequest("POST", "https://api.start.gg/gql/alpha", bytes.NewBuffer(query))
	if err != nil {
		return nil, errors.Join(errors.New("HTTP Request - "), err)
	}

	// Sets the headers within the request.
	req.Header.Set("Content-Type", "application/json")

	// Sends the request and receives the response of it.
	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, errors.Join(errors.New("HTTP Response - "), err)
	}
	defer res.Body.Close() //nolint:errcheck

	data, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, errors.Join(errors.New("read Data - "), err)
	}

	validation, err := validateData(data)
	if err != nil {
		return nil, err
	}
	if validation != "" {
		return nil, fmt.Errorf("data Validation: %s", validation)
	}

	return data, nil
}

// Execute query for get data from startgg according T type
func GetData[T any](c *Client, rawQuery string, variables map[string]any) (*T, error) {
	preparedQuery, err := json.Marshal(PrepareQuery(rawQuery, variables))
	if err != nil {
		return nil, fmt.Errorf("JSON Marshal - %w", err)
	}

	rawData, err := c.RunQuery(preparedQuery)
	if err != nil {
		return nil, fmt.Errorf("RunQuery - %w", err)
	}

	var results T
	err = json.Unmarshal(rawData, &results)
	if err != nil {
		return nil, fmt.Errorf("JSON Unmarshal - %w", err)
	}

	return &results, nil
}

func (c *Client) LoadDataFromJSON(path string, gameName string) ([]startgg.ImportedParticipantContact, error) {
	if path == "" {
		return nil, errors.New("loadJSON: filename is empty")
	}

	f, err := os.ReadFile(path)
	if err != nil {
		return []startgg.ImportedParticipantContact{}, fmt.Errorf("loadJSON: open file, %v", err)
	}

	var rows []startgg.ParticipantImportContact
	if err := json.Unmarshal(f, &rows); err != nil {
		var row startgg.ParticipantImportContact
		if err2 := json.Unmarshal(f, &row); err2 == nil {
			rows = append(rows, row)
		} else {
			return nil, fmt.Errorf("loadJSON: unmarshal error: %w", err)
		}
	}

	participants := make([]startgg.ImportedParticipantContact, 0, len(rows))
	for _, row := range rows {
		nickname := row.GameNickname
		if nickname == "" {
			if row.MessengerLogin != "" {
				nickname = row.MessengerLogin
			} else {
				nickname = "N/D"
			}
		}

		activeGameName := row.GameName
		if activeGameName == "" {
			activeGameName = gameName
		}

		gameID := row.GameID
		if gameID == "" {
			gameID = "N/D"
		}

		messengerName := row.MessengerName
		if messengerName == "" {
			messengerName = "N/D"
		}

		messengerLogin := row.MessengerLogin
		if messengerLogin == "" {
			messengerLogin = "N/D"
		}

		locale := row.Locale
		if locale == "" || locale == "N/D" {
			locale = "EN"
		}

		participants = append(participants, startgg.ImportedParticipantContact{
			Nickname:                nickname,
			GameId:                  gameID,
			GameName:                activeGameName,
			Region:                  "N/D",
			Locale:                  locale,
			Rating:                  0,
			MessengerName:           messengerName,
			MessengerLogin:          messengerLogin,
			TournamentPlatformName:  "Startgg",
			TournamentPlatformLogin: "N/D",
			TournamentPlatformId:    "N/D",
			Discriminator:           "N/D",
		})

	}

	return participants, nil
}

func (c *Client) LoadDataFromCSV(path string, gameName string) ([]startgg.ImportedParticipantContact, error) {
	if path == "" {
		return nil, errors.New("loadCSV: filename is empty")
	}

	f, err := os.Open(path)
	if err != nil {
		logger.Log(entityLogger.Error, fmt.Sprintf("loadCSV: can't open file %v - %v", path, err))
		return []startgg.ImportedParticipantContact{}, fmt.Errorf("loadCSV: open file, %v", err)
	}
	defer f.Close() //nolint:errcheck

	csvReader := csv.NewReader(f)
	records, err := csvReader.ReadAll()
	if err != nil {
		return []startgg.ImportedParticipantContact{}, fmt.Errorf("loadCSV: read CSV, %v", err)
	}

	if len(records) == 0 {
		return []startgg.ImportedParticipantContact{}, fmt.Errorf("loadCSV: 0 records CSV, %v", err)
	}

	logger.Log(entityLogger.Success, fmt.Sprintf("CSV Read complete. Total rows: %d. First row column count: %d. First row layout: %v", len(records), len(records[0]), records[0]))

	// Search index for get data
	var idxDiscordColumn, idxGamerTagColumn, idxConnectColumn, idxDiscriminatorColumn, idxDiscordIDColumn int
	for index, column := range records[0] {
		if column == "Discord ID" {
			idxDiscordIDColumn = index
		}
		if column == "Discriminator" {
			idxDiscriminatorColumn = index
		}
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

	participants := make([]startgg.ImportedParticipantContact, 0, len(records)-1)
	for i := 1; i < len(records); i++ {
		attendee := records[i]
		if len(attendee) <= idxGamerTagColumn {
			logger.Log(entityLogger.Error, "loadCSV: very short data (no column GamerTag)")
			continue
		}

		var gameNickname string
		if val := attendee[idxGamerTagColumn]; val != "" {
			gameNickname = val
		} else {
			logger.Log(entityLogger.Error, fmt.Sprintf("String #%d is skipped: empty GamerTag", i))
			continue
		}

		var discordLogin string
		if idxDiscordColumn < len(attendee) && attendee[idxDiscordColumn] != "" {
			discordLogin = attendee[idxDiscordColumn]
		}

		var discordId string
		if val := attendee[idxDiscordIDColumn]; val != "" {
			discordId = val
		}

		var discriminator string
		var UserStartgg startgg.UserData
		if val := attendee[idxDiscriminatorColumn]; val != "" {
			if len(val) != 0 {
				discriminator = val
				UserStartgg, err = c.GetUserBySlug(discriminator)
				if err != nil {
					logger.Log(entityLogger.Error, fmt.Sprintf("loadCSV: can't get user data for slug %v - %v", discriminator, err))
				}
			} else {
				discriminator = "N/D"
			}
		}

		var gameID string
		if val := attendee[idxConnectColumn]; val != "" {
			rawGameID := strings.Split(attendee[idxConnectColumn], " ")
			if len(rawGameID) >= 2 {
				gameID = strings.ReplaceAll(rawGameID[1], ",", "")
			} else {
				gameID = strings.ReplaceAll(val, ",", "")
			}
		}

		if gameID == "" {
			gameID = "N/D"
		}
		if gameNickname == "" {
			if len(UserStartgg.User.Player.GamerTag) != 0 {
				gameNickname = UserStartgg.User.Player.GamerTag
			} else {
				gameNickname = "N/D"
			}
		}
		if discordLogin == "" {
			if len(UserStartgg.User.Authorizations) != 0 {
				discordLogin = UserStartgg.User.Authorizations[0].Discord
			} else {
				discordLogin = "N/D"
			}
		}

		if discordId == "" {
			discordId = "N/D"
		}

		var tournamentPlatformLogin string
		if len(UserStartgg.User.Player.GamerTag) != 0 {
			tournamentPlatformLogin = UserStartgg.User.Player.GamerTag
		} else {
			tournamentPlatformLogin = "N/D"
		}

		var tournamentPlatformId string
		if UserStartgg.User.ID != 0 {
			tournamentPlatformId = strconv.FormatInt(UserStartgg.User.ID, 10)
		} else {
			tournamentPlatformId = "N/D"
		}
		logger.Log(entityLogger.Info, fmt.Sprintf("CSV Headers parsed. Discord: %d, GamerTag: %d, Connect: %d, Discriminator: %d",
			idxDiscordColumn, idxGamerTagColumn, idxConnectColumn, idxDiscriminatorColumn))
		if attendee[idxGamerTagColumn] != "" {
			participants = append(participants, startgg.ImportedParticipantContact{
				Nickname:                gameNickname,
				GameId:                  gameID,
				GameName:                gameName,
				Region:                  "N/D",
				Locale:                  "N/D",
				Rating:                  0,
				MessengerName:           "Discord",
				MessengerLogin:          discordLogin,
				MessengerID:             discordId,
				TournamentPlatformName:  "Startgg",
				TournamentPlatformLogin: tournamentPlatformLogin,
				TournamentPlatformId:    tournamentPlatformId,
				Discriminator:           discriminator,
			})
		}
	}

	return participants, nil
}
