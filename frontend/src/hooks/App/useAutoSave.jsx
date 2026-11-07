import { useMemo } from "react";
import { debounce } from "../../utils/debounce";

import {
  SaveToolsCfg,
  SaveSettingsApp,
  SaveWidgetsCfg,
  SaveAuthorizations,
} from "../../../wailsjs/go/application/App.js";

export function useAutoSave() {

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
            scoreboard: {
              theme:           cfg.scoreboard?.theme           || "default",
              titleMatch:      cfg.scoreboard?.titleMatch      ?? "",
              hideLogos:       cfg.scoreboard?.hideLogos       ?? false,
              hideFlags:       cfg.scoreboard?.hideFlags       ?? false,
              scale:           cfg.scoreboard?.scale           ?? 1.0,
              sideGap:         cfg.scoreboard?.sideGap         ?? 480,
              sideWidth:       cfg.scoreboard?.sideWidth       ?? 460,
              format:          cfg.scoreboard?.format          || "FT2",
              P1: {
                teamTag:  cfg.scoreboard?.P1?.teamTag  ?? "",
                name:     cfg.scoreboard?.P1?.name     ?? "Player 1",
                logoPath: cfg.scoreboard?.P1?.logoPath ?? "",
                flag:     cfg.scoreboard?.P1?.flag     ?? "",
                points:   cfg.scoreboard?.P1?.points   ?? 0,
                showLogo: cfg.scoreboard?.P1?.showLogo ?? true,
                showFlag: cfg.scoreboard?.P1?.showFlag ?? true,
              },
              P2: {
                teamTag:  cfg.scoreboard?.P2?.teamTag  ?? "",
                name:     cfg.scoreboard?.P2?.name     ?? "Player 2",
                logoPath: cfg.scoreboard?.P2?.logoPath ?? "",
                flag:     cfg.scoreboard?.P2?.flag     ?? "",
                points:   cfg.scoreboard?.P2?.points   ?? 0,
                showLogo: cfg.scoreboard?.P2?.showLogo ?? true,
                showFlag: cfg.scoreboard?.P2?.showFlag ?? true,
              },
            },
          };
          await SaveWidgetsCfg(dataToSend);
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

  // ============================================================
  // Tools (tools.toml)
  // ============================================================
  const debouncedSaveTools = useMemo(
    () => debounce((cfg) => SaveToolsCfg(cfg), 1000), [],
  );

  return {
    debouncedSaveSettings,
    debouncedSaveWidgets,
    debouncedSaveAuthorizations,
    debouncedSaveTools,
  };
}