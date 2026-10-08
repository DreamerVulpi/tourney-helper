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