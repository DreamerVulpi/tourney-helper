import { useMemo } from "react";
import { debounce } from "../../utils/debounce";

import {
  SaveTournamentConfig,
  SaveSettingsApp,
  SaveWidgetsConfig,
  SaveAuthorizations,
} from "../../../wailsjs/go/application/App.js";

export function useAutoSave() {
  // ============================================================
  // Tournament (tournament.toml)
  // ============================================================
  const debouncedSaveTourney = useMemo(
    () =>
      debounce((cfg) => {
        const dataToSend = {
          urlToTournament: cfg.urlToTournament || "",
          rules: {
            standardFormat: parseInt(cfg.rules?.standardFormat) || 2,
            finalsFormat:   parseInt(cfg.rules?.finalsFormat)   || 3,
            rounds:         parseInt(cfg.rules?.rounds)         || 3,
            duration:       parseInt(cfg.rules?.duration)       || 60,
            stage:          cfg.rules?.stage ?? "Random",
          },
          stream: {
            area:          cfg.stream?.area          ?? "Any",
            language:      cfg.stream?.language      ?? "EN",
            connection:    cfg.stream?.connection    ?? "Wired",
            crossplatform: cfg.stream?.crossplatform ?? false,
            passcode:      cfg.stream?.passcode      ?? "0000",
            linkToLobby:   cfg.stream?.linkToLobby   ?? "",
          },
          logo: cfg.logo || { img: "" },
          csv:  cfg.csv  || { nameFile: "" },
          game: cfg.game || { name: "" },
        };
        SaveTournamentConfig(dataToSend);
      }, 1000),
    [],
  );

  // ============================================================
  // Settings (settings.toml)
  // ============================================================
  const debouncedSaveSettings = useMemo(
    () =>
      debounce(async (cfg) => {
        try {
          await SaveSettingsApp(cfg);
          console.log("Settings saved on backend");
        } catch (err) {
          console.error("Could not save settings:", err);
        }
      }, 1000),
    [],
  );

  // ============================================================
  // Widgets (widgets.toml)
  // ============================================================
  const debouncedSaveWidgets = useMemo(
    () =>
      debounce(async (cfg) => {
        try {
          const dataToSend = {
            bracket: {
              urlToTournament: cfg.bracket?.urlToTournament || "",
              bracketId:       cfg.bracket?.bracketId       || "",
              theme:           cfg.bracket?.theme           || "Default",
              clearBackground: cfg.bracket?.clearBackground ?? false,
              hideStages:      cfg.bracket?.hideStages      ?? false,
              bracketMode:     cfg.bracket?.bracketMode     || "all",
              scale:           cfg.bracket?.scale           ?? 1.0,
              autoRefresh:     cfg.bracket?.autoRefresh     ?? false,
            },
          };
          await SaveWidgetsConfig(dataToSend);
          console.log("Widgets config saved on backend");
        } catch (err) {
          console.error("Could not save widgets config:", err);
        }
      }, 1000),
    [],
  );

  // ============================================================
  // Authorizations (authorizations.toml)
  // ============================================================
  const debouncedSaveAuthorizations = useMemo(
    () =>
      debounce(async (cfg) => {
        try {
          await SaveAuthorizations(cfg);
          console.log("Authorizations saved on backend");
        } catch (err) {
          console.error("Could not save authorizations:", err);
        }
      }, 1000),
    [],
  );

  return {
    debouncedSaveTourney,
    debouncedSaveSettings,
    debouncedSaveWidgets,
    debouncedSaveAuthorizations,
  };
}