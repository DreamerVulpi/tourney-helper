import { useMemo } from "react";
import { debounce } from "../../utils/debounce";

import {
  SaveToolsCfg,
  SaveSettingsApp,
  SaveWidgetsCfg,
  SaveAuthorizations,
} from "../../../wailsjs/go/application/App.js";

const serializeSide = (side, fallbackName) => ({
  teamTag:    side?.teamTag    ?? "",
  name:       side?.name       ?? fallbackName,
  resetIcon:     side?.resetIcon     ?? "",
  resetIconData: side?.resetIconData ?? "",
  resetIconScale: side?.resetIconScale ?? 1,
  logoPath:   side?.logoPath   ?? "",
  flag:       side?.flag       ?? "",
  plateImage:   side?.plateImage   ?? "",
  points:       side?.points       ?? 0,
  scoreOffsetX: side?.scoreOffsetX ?? 0,
  scoreOffsetY: side?.scoreOffsetY ?? 0,
  scoreFontSize: side?.scoreFontSize ?? 28,
  showLogo:   side?.showLogo   ?? true,
  showFlag:   side?.showFlag   ?? true,
  showReset:  side?.showReset  ?? false,
});

const serializeBracket = (b) => ({
  urlToTournament: b?.urlToTournament || "",
  bracketId:       b?.bracketId       || "",
  theme:           b?.theme           || "Default",
  clearBackground: b?.clearBackground ?? false,
  hideStages:      b?.hideStages      ?? false,
  bracketMode:     b?.bracketMode     || "all",
  scale:           b?.scale           ?? 1.0,
  autoRefresh:     b?.autoRefresh     ?? false,
});

const serializeScoreboard = (s) => ({
  theme:           s?.theme           || "default",
  titleMatch:      s?.titleMatch      ?? "",
  fontFamily:      s?.fontFamily      ?? "",
  mainFontSize:    s?.mainFontSize    ?? 24,
  hideLogos:       s?.hideLogos       ?? false,
  hideFlags:       s?.hideFlags       ?? false,
  scale:           s?.scale           ?? 1.0,
  sideGap:         s?.sideGap         ?? 480,
  sideWidth:       s?.sideWidth       ?? 460,
  plateMode:       s?.plateMode       || "builtin",
  format:          s?.format          ?? "FT2",
  P1: serializeSide(s?.P1, "Player 1"),
  P2: serializeSide(s?.P2, "Player 2"),
});

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
            bracket: serializeBracket(cfg.bracket),
            scoreboard: serializeScoreboard(cfg.scoreboard),
            bracketSlots: Array.isArray(cfg.bracketSlots)
              ? cfg.bracketSlots.map(serializeBracket)
              : [],
            scoreboardSlots: Array.isArray(cfg.scoreboardSlots)
              ? cfg.scoreboardSlots.map(serializeScoreboard)
              : [],
            bracketSlotNames: Array.isArray(cfg.bracketSlotNames)
              ? cfg.bracketSlotNames
              : [],
            scoreboardSlotNames: Array.isArray(cfg.scoreboardSlotNames)
              ? cfg.scoreboardSlotNames
              : [],
            activeBracketSlot: cfg.activeBracketSlot ?? 0,
            activeScoreboardSlot: cfg.activeScoreboardSlot ?? 0,
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