package sender

import (
	"fmt"
	"strings"

	"github.com/dreamervulpi/tourneyBot/internal/auth"
	"github.com/dreamervulpi/tourneyBot/internal/entity/sender"
)

func GetTournamentAdapter(authClient *auth.AuthClient, messengerName string, url string, debug bool, game string, contacts map[string]sender.Participant) (sender.NotificationData, error) {
	switch strings.ToLower(authClient.NamePlatform) {
	case "startgg":
		client, err := auth.GetClientStartgg(authClient)
		if err != nil {
			return nil, err
		}
		return NewStartggAdapter(client, messengerName, url, debug, game, contacts), nil
	case "challonge":
		client, err := auth.GetClientChallonge(authClient)
		if err != nil {
			return nil, err
		}
		// TODO: Load contacts from file for challonge
		// TODO: Change to actual version like Startgg
		return NewChallongeAdapter(client, url, debug, contacts), nil
	default:
		return nil, fmt.Errorf("getTournamentAdapter | Can't get adapter for platform called: %s", authClient.NamePlatform)
	}
}
