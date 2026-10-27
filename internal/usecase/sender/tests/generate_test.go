package sender_test

import (
	"strconv"

	"github.com/dreamervulpi/tourney-helper/internal/entity/startgg"
)

func createParticipant(
	id int64,
	tag string,
	discord string,
) startgg.Participant {
	return startgg.Participant{
		GamerTag: tag,
		User: startgg.User{
			ID: id,
			Authorizations: []startgg.Authorizations{
				{
					Discord: discord,
				},
			},
		},
	}
}

func realSet(
	id int64,
	p1 startgg.Participant,
	p2 startgg.Participant,
	round int,
	state startgg.State,
) startgg.Nodes {

	return startgg.Nodes{
		Id:    startgg.SetID(strconv.FormatInt(id, 10)),
		State: state,
		Round: round,

		Stream: startgg.Streamer{
			StreamName:   "Twitch",
			StreamSource: "https://twitch.tv/test",
		},

		Slots: []startgg.Slot{
			{
				Entrant: startgg.Entrant{
					Participants: []startgg.Participant{
						p1,
					},
				},
			},
			{
				Entrant: startgg.Entrant{
					Participants: []startgg.Participant{
						p2,
					},
				},
			},
		},
	}
}

func previewSet(
	key string, // example "preview_3435724_-3_0"
	round int,
) startgg.Nodes {
	return startgg.Nodes{
		Id:    startgg.SetID(key),
		State: startgg.IsNotStarted,
		Round: round,
		Slots: []startgg.Slot{{}, {}},
	}
}
