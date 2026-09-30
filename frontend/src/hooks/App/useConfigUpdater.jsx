import { useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";

export function useConfigUpdater({
  isLoaded,
  debouncedSaveSettings,
  debouncedSaveTourney,
  debouncedSaveWidgets,
  debouncedSaveAuthorizations,
}) {
  // Достаём сеттеры из стора — не тащим через пропсы
  const setSettings       = useAppStore((s) => s.setSettings);
  const setTournament     = useAppStore((s) => s.setTournament);
  const setWidgets        = useAppStore((s) => s.setWidgets);
  const setAuthorizations = useAppStore((s) => s.setAuthorizations);

  const updateConfig = useCallback(
    (type, data) => {
      console.log("[updateConfig] called", type, data);
      if (!isLoaded) return;

      // ============================================================
      // SETTINGS (settings.toml)
      // ============================================================
      if (type === "settings") {
        setSettings((prev) => {
          const newCfg = { ...prev, ...data };
          debouncedSaveSettings(newCfg);
          return newCfg;
        });
        return;
      }

      // ============================================================
      // TOURNAMENT (tournament.toml)
      // ============================================================
      if (type === "tourney") {
        setTournament((prev) => {
          const newCfg = {
            ...prev,
            ...data,
            stream: data.stream
              ? { ...prev?.stream, ...data.stream }
              : prev?.stream,
            rules: data.rules
              ? { ...prev?.rules, ...data.rules }
              : prev?.rules,
            logo: data.logo
              ? { ...prev?.logo, ...data.logo }
              : prev?.logo,
            csv: data.csv
              ? { ...prev?.csv, ...data.csv }
              : prev?.csv,
            game: data.game
              ? { ...prev?.game, ...data.game }
              : prev?.game,
          };
          debouncedSaveTourney(newCfg);
          return newCfg;
        });
        return;
      }

      // ============================================================
      // WIDGETS (widgets.toml)
      // ============================================================
      if (type === "widgets") {
        setWidgets((prev) => {
          const newCfg = {
            ...prev,
            ...data,
            bracket: data.bracket
              ? { ...prev?.bracket, ...data.bracket }
              : prev?.bracket,
          };
          debouncedSaveWidgets(newCfg);
          return newCfg;
        });
        return;
      }

      // ============================================================
      // AUTHORIZATIONS (authorizations.toml)
      // ============================================================
      if (type === "authorizations") {
        setAuthorizations((prev) => {
          const newCfg = { ...prev, ...data };
          debouncedSaveAuthorizations(newCfg);
          return newCfg;
        });
        return;
      }

      console.warn("[updateConfig] unknown type:", type);
    },
    [
      isLoaded,
      setSettings,
      setTournament,
      setWidgets,
      setAuthorizations,
      debouncedSaveSettings,
      debouncedSaveTourney,
      debouncedSaveWidgets,
      debouncedSaveAuthorizations,
    ]
  );

  return { updateConfig };
}