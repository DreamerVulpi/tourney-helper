package sender_test

import (
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

func createSet(
	id int64,
	p1 startgg.Participant,
	p2 startgg.Participant,
	round int,
	state startgg.State,
) startgg.Nodes {

	return startgg.Nodes{
		Id:    id,
		State: state,
		Round: round,

		Stream: startgg.Streamer{
			StreamName:   "Twitch",
			StreamSource: "https://twitch.tv/test",
		},

		Slots: []startgg.Slots{
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
