package discord

import (
	locale "github.com/dreamervulpi/tourney-helper/internal/entity/locale/bot"
)

func fieldCrossplay(local locale.Lang, state bool) string {
	crossplay := local.InviteMessage.CrossplatformStatusTrue
	if !state {
		crossplay = local.InviteMessage.CrossplatformStatusFalse
	}
	return crossplay
}

func fieldStage(local locale.Lang, currentStage string) string {
	switch currentStage {
	case "Any":
		return local.Stages.Any
	case "Random":
		return local.Stages.Random
	case "Repeat":
		return local.Stages.Repeat
	case "Selected":
		return local.Stages.Selected
	case "":
		return local.ErrorMessage.NoData
	default:
		return currentStage
	}
}
func fieldLanguage(local locale.Lang, currentLanguage string) string {
	lang := local.StreamLobbyMessage.AnyLanguage
	if currentLanguage != "any" {
		lang = local.StreamLobbyMessage.SameLanguage
	}
	return lang
}
func fieldArea(local locale.Lang, currentArea string) string {
	switch currentArea {
	case "Any":
		return local.StreamLobbyMessage.ListRegions.Any
	case "Europe":
		return local.StreamLobbyMessage.ListRegions.Europe
	case "Asia":
		return local.StreamLobbyMessage.ListRegions.Asia
	case "NorthAmerica":
		return local.StreamLobbyMessage.ListRegions.NorthAmerica
	case "SouthAmerica":
		return local.StreamLobbyMessage.ListRegions.Europe
	case "Africa":
		return local.StreamLobbyMessage.ListRegions.Africa
	case "Other":
		return local.StreamLobbyMessage.ListRegions.Other
	case "":
		return local.StreamLobbyMessage.ListRegions.ND
	case "N/D":
		return local.StreamLobbyMessage.ListRegions.ND
	default:
		return currentArea
	}

}
func fieldConnection(local locale.Lang, typeConn string) string {
	switch typeConn {
	case "LAN":
		return local.StreamLobbyMessage.Connection.LAN
	default:
		return local.StreamLobbyMessage.Connection.Any
	}
}
