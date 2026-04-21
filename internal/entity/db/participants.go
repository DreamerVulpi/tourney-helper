package db

import "time"

// type Participant struct {
// 	GamerTag               string    `json:"gamerTag"`
// 	MessengerPlatform      string    `json:"messengerPlatform"`
// 	MessengerPlatformId    string    `json:"messengerPlatformId"`
// 	MessengerPlatformLogin string    `json:"messengerPlatformLogin"`
// 	UpdatedAt              time.Time `json:"updatedAt"`
// 	IsFound                bool      `json:"isFound"`
// 	Locale                 string    `json:"locale"`
// }

// type ParticipantAddRequest struct {
// 	GamerTag               string    `json:"gamerTag"`
// 	MessengerPlatform      string    `json:"messengerPlatform"`
// 	MessengerPlatformId    string    `json:"messengerPlatformId"`
// 	MessengerPlatformLogin string    `json:"messengerPlatformLogin"`
// 	UpdatedAt              time.Time `json:"updatedAt"`
// 	IsFound                bool      `json:"isFound"`
// 	Locale                 string    `json:"locale"`
// }

// type ParticipantEditRequest struct {
// 	GamerTag                string    `json:"gamerTag"`
// 	MessenagerPlatform      string    `json:"messenagerPlatform"`
// 	MessenagerPlatformId    string    `json:"messenagerPlatformId"`
// 	MessenagerPlatformLogin string    `json:"messenagerPlatformLogin"`
// 	UpdatedAt               time.Time `json:"updatedAt"`
// 	IsFound                 bool      `json:"isFound"`
// 	Locale                  string    `json:"locale"`
// }

// type ParticipantDeleteRequest struct {
// 	GamerTag           string `json:"gamerTag"`
// 	MessenagerPlatform string `json:"messenagerPlatform"`
// }

// type ParticipantGetRequest struct {
// 	GamerTag           string `json:"gamerTag"`
// 	MessenagerPlatform string `json:"messenagerPlatform"`
// }

// type ParticipantAddResponse struct {
// 	GamerTag          string `json:"gamerTag"`
// 	MessengerPlatform string `json:"messengerPlatform"`
// }

// type ParticipantEditResponse struct{}
// type ParticipantDeleteResponse struct{}
// type ParticipantGetResponse struct {
// 	GamerTag               string    `json:"gamerTag"`
// 	MessengerPlatform      string    `json:"messengerPlatform"`
// 	MessengerPlatformId    string    `json:"messengerPlatformId"`
// 	MessengerPlatformLogin string    `json:"messengerPlatformLogin"`
// 	UpdatedAt              time.Time `json:"updatedAt"`
// 	IsFound                bool      `json:"isFound"`
// 	Locale                 string    `json:"locale"`
// }

type Participant struct {
	Id        int       `json:"id"`
	Nickname  string    `json:"nickname"`
	Region    string    `json:"region"`
	Locale    string    `json:"locale"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ParticipantAddRequest struct {
	Nickname  string    `json:"nickname"`
	Region    string    `json:"region"`
	Locale    string    `json:"locale"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ParticipantEditRequest struct {
	Id        int       `json:"id"`
	Nickname  string    `json:"nickname"`
	Region    string    `json:"region"`
	Locale    string    `json:"locale"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ParticipantDeleteRequest struct {
	Id int `json:"id"`
}

type ParticipantGetRequestById struct {
	Id int `json:"id"`
}

type ParticipantGetRequestByNickname struct {
	Nickname string `json:"nickname"`
}

type ParticipantAddResponse struct {
	Id int `json:"id"`
}

type ParticipantEditResponse struct{}

type ParticipantDeleteResponse struct{}

type ParticipantGetResponse struct {
	Id        int       `json:"id"`
	Nickname  string    `json:"nickname"`
	Region    string    `json:"region"`
	Locale    string    `json:"locale"`
	UpdatedAt time.Time `json:"updated_at"`
}
