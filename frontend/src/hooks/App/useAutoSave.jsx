import { useMemo } from "react";
import { debounce } from "../../utils/debounce";

import {
  SaveSystemConfig,
  SaveTournamentConfig,
  SaveSettingsApp,
} from "../../../wailsjs/go/application/App.js";

export function useAutoSave() {
  const debouncedSaveSystem = useMemo(
    () => debounce((cfg) => SaveSystemConfig(cfg), 1000),
    [],
  );
  const debouncedSaveTourney = useMemo(
    () =>
      debounce((cfg) => {
        const dataToSend = {
          ...cfg,
          startgg: cfg.startgg || {},
          challonge: cfg.challonge || {},
          rules: {
            ...cfg.rules,
            standardFormat: parseInt(cfg.rules?.standardFormat) || 2,
            finalsFormat: parseInt(cfg.rules?.finalsFormat) || 3,
            rounds: parseInt(cfg.rules?.rounds) || 3,
            duration: parseInt(cfg.rules?.duration) || 60,
            stage: cfg.rules?.stage ?? "Random",
          },
        };
        SaveTournamentConfig(dataToSend);
      }, 1000),
    [],
  );

  const debouncedSaveSettings = useMemo(
    () =>
      debounce(async (cfg) => {
        try {
          await SaveSettingsApp(cfg);
          console.log(
            "The app settings have been successfully saved on the backend",
          );
        } catch (err) {
          console.error("The app settings could not be saved:", err);
        }
      }, 1000),
    [],
  );

  return {
    debouncedSaveSystem,
    debouncedSaveTourney,
    debouncedSaveSettings,
  };
}
