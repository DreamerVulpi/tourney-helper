package discord

import (
	locale "github.com/dreamervulpi/tourneyBot/internal/entity/locale/bot"
)

func fieldCrossplay(local locale.Lang, state bool) string {
	crossplay := local.InviteMessage.CrossplatformStatusTrue
	if !state {
		crossplay = local.InviteMessage.CrossplatformStatusFalse
	}
	return crossplay
}

func fieldStage(local locale.Lang, currentStage string) string {
	stage := local.InviteMessage.AnyStage
	if currentStage != "any" {
		stage = currentStage
	}
	return stage
}
func fieldLanguage(local locale.Lang, currentLanguage string) string {
	lang := local.StreamLobbyMessage.AnyLanguage
	if currentLanguage != "any" {
		lang = local.StreamLobbyMessage.SameLanguage
	}
	return lang
}
func fieldArea(local locale.Lang, currentArea string) string {
	area := local.StreamLobbyMessage.AnyArea
	if currentArea != "any" {
		area = local.StreamLobbyMessage.CloseArea
	}
	return area
}
func fieldConnection(local locale.Lang, typeConn string) string {
	conn := local.StreamLobbyMessage.AnyConnection
	if typeConn != "any" {
		conn = typeConn
	}
	return conn
}
