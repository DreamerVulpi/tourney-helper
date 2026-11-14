import {
  LoadSettingsApp,
  LoadToolsCfg,
  LoadWidgetsCfg,
  LoadAuthorizations,
  RestoreClientStatuses,
  GetActiveProfileName,
  GetOAuthBaseURL,
  GetWidgetBaseURL,
} from "../../../wailsjs/go/application/App.js";
import { useAppStore } from "../../store/useAppStore";
import { pruneSelections } from "../../utils/integrations.js";

const normalizeSide = (side, fallbackName) => ({
  teamTag:    side?.teamTag    ?? "",
  name:       side?.name       ?? fallbackName,
  resetIcon:     side?.resetIcon     ?? "",
  resetIconData: side?.resetIconData ?? "",
  resetIconScale: typeof side?.resetIconScale === "number" && side.resetIconScale > 0 ? side.resetIconScale : 1,
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

const normalizeBracket = (b) => ({
  urlToTournament: b?.urlToTournament ?? "",
  bracketId:       b?.bracketId       ?? "",
  theme:           b?.theme           ?? "StartGG",
  clearBackground: b?.clearBackground ?? false,
  hideStages:      b?.hideStages      ?? false,
  bracketMode:     b?.bracketMode     ?? "all",
  scale:           typeof b?.scale === "number" && b.scale > 0 ? b.scale : 1.0,
  autoRefresh:     b?.autoRefresh     ?? false,
});

const normalizeScoreboard = (s) => ({
  theme:           s?.theme === "Default" ? "default" : (s?.theme || "default"),
  titleMatch:      s?.titleMatch      ?? "CUSTOM NAME",
  fontFamily:      s?.fontFamily      ?? "",
  mainFontSize:    typeof s?.mainFontSize === "number" && s.mainFontSize > 0 ? s.mainFontSize : 24,
  hideLogos:       s?.hideLogos       ?? false,
  hideFlags:       s?.hideFlags       ?? false,
  scale:           typeof s?.scale === "number" && s.scale > 0 ? s.scale : 1.0,
  sideGap:         typeof s?.sideGap === "number" && s.sideGap > 0 ? s.sideGap : 480,
  sideWidth:       typeof s?.sideWidth === "number" && s.sideWidth > 0 ? s.sideWidth : 460,
  plateMode:       s?.plateMode       || "builtin",
  format:          s?.format          ?? "FT2",
  P1: normalizeSide(s?.P1, "Player 1"),
  P2: normalizeSide(s?.P2, "Player 2"),
});

const SLOT_COUNT = 5;

const clampSlotIndex = (value) => {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < SLOT_COUNT ? index : 0;
};

const normalizeSlots = (slots, fallback, normalize) => {
  const list = Array.isArray(slots) ? slots.slice(0, SLOT_COUNT).map(normalize) : [];
  while (list.length < SLOT_COUNT) list.push(normalize(fallback));
  return list;
};

const normalizeSlotNames = (names) => {
  const list = Array.isArray(names) ? names.slice(0, SLOT_COUNT) : [];
  while (list.length < SLOT_COUNT) list.push("");
  return list.map((name, index) => {
    const value = String(name ?? "").trim();
    return value || `Slot ${index + 1}`;
  });
};

export async function hydrateFromBackend({ markLoaded = false } = {}) {
  const store = useAppStore.getState();

  const activeProfile = await GetActiveProfileName();
  store.setActiveProfile(activeProfile || "");

  const [oauthBaseUrl, widgetBaseUrl] = await Promise.all([
    GetOAuthBaseURL(),
    GetWidgetBaseURL(),
  ]);
  store.setOAuthBaseUrl(oauthBaseUrl || "");
  store.setWidgetBaseUrl(widgetBaseUrl || "");

  const settings = await LoadSettingsApp();
  
  let integrationsSelections = {};
  if (settings) {
    const lang  = settings.Language || settings.language || "EN";
    const theme = (settings.Theme || settings.theme || "dark").toLowerCase();
    const checkUpdatesOnStartUp =
      settings.CheckUpdatesOnStartUp ?? settings.checkUpdatesOnStartUp ?? false;
    const ignoredVersion =
      settings.IgnoredVersion || settings.ignoredVersion || "";
    const sidePanelCollapsed =
      settings.SidePanelCollapsed ?? settings.sidePanelCollapsed ?? false;
    const debugMode =
      settings.DebugMode ?? settings.debugMode ?? false;

    integrationsSelections =
      settings.IntegrationsSelections ?? settings.integrationsSelections ?? {};

    store.setSettings((prev) => ({
      ...(prev ?? {}),
      Language: lang,
      Theme: theme,
      CheckUpdatesOnStartUp: checkUpdatesOnStartUp,
      IgnoredVersion: ignoredVersion,
      SidePanelCollapsed: sidePanelCollapsed,
      DebugMode: debugMode,
    }));

    store.setLang(lang);
    store.setTheme(theme);
    store.setSidePanelCollapsed(sidePanelCollapsed);
    
  }

  // 3. Tools
  const tools = await LoadToolsCfg();
  if (tools) {
    const ns = tools?.notificationSystem ?? {};
    store.setTools((prev) => ({
      ...(prev ?? {}),
      notificationSystem: {
        urlToTournament: ns.urlToTournament ?? "",
        rules: {
          standardFormat: normalizeFormat(ns.rules?.standardFormat, "FT2"),
          finalsFormat:   normalizeFormat(ns.rules?.finalsFormat,   "FT3"),
          rounds:         Number(ns.rules?.rounds)         || 3,
          duration:       Number(ns.rules?.duration)       || 60,
          stage:          ns.rules?.stage ?? "Random",
        },
        stream: {
          area:          ns.stream?.area          ?? "Any",
          language:      ns.stream?.language      ?? "EN",
          conn:          ns.stream?.conn          ?? "Wired",
          crossplatform: ns.stream?.crossplatform ?? false,
          passcode:      ns.stream?.passcode      ?? "0000",
          linkToLobby:   ns.stream?.linkToLobby   ?? "",
        },
        logo: { img: ns.logo?.img ?? "" },
        game: { name: ns.game?.name ?? "tekken" },
      },
    }));
  }

  // 4. Widgets
  const widgets = await LoadWidgetsCfg();
  if (widgets) {
    const bracket = normalizeBracket(widgets.bracket);
    const scoreboard = normalizeScoreboard(widgets.scoreboard);
    const activeBracketSlot = clampSlotIndex(widgets.activeBracketSlot);
    const activeScoreboardSlot = clampSlotIndex(widgets.activeScoreboardSlot);
    const bracketSlots = normalizeSlots(
      widgets.bracketSlots,
      bracket,
      normalizeBracket,
    );
    const scoreboardSlots = normalizeSlots(
      widgets.scoreboardSlots,
      scoreboard,
      normalizeScoreboard,
    );
    const bracketSlotNames = normalizeSlotNames(widgets.bracketSlotNames);
    const scoreboardSlotNames = normalizeSlotNames(widgets.scoreboardSlotNames);

    bracketSlots[activeBracketSlot] = bracket;
    scoreboardSlots[activeScoreboardSlot] = scoreboard;

    store.setWidgets((prev) => ({
      ...(prev ?? {}),
      bracket,
      scoreboard,
      bracketSlots,
      scoreboardSlots,
      bracketSlotNames,
      scoreboardSlotNames,
      activeBracketSlot,
      activeScoreboardSlot,
    }));
  }

  // 5. Authorizations
  const auths = await LoadAuthorizations();
  if (auths) {
    store.setAuthorizations({
      startgg:   normalizePlatform(auths.startgg),
      challonge: normalizePlatform(auths.challonge),
      discord:   normalizePlatform(auths.discord),
      telegram:  normalizePlatform(auths.telegram),
    });

    store.setAuthorizations((prev) => {
      const markPending = (platform) => ({
        ...platform,
        slots: (platform?.slots || []).map((s) =>
          s && (s.clientID || s.token || s.created)
            ? { ...s, status: "pending" }
            : s
        ),
      });
      return {
        startgg:   markPending(prev.startgg),
        challonge: markPending(prev.challonge),
        discord:   markPending(prev.discord),
        telegram:  markPending(prev.telegram),
      };
    });
  }

  if (markLoaded) {
    store.setIsLoaded(true);
  }

  // 6. Восстановление статусов + гидратация selections
  try {
    const restored = await RestoreClientStatuses();
    if (restored) {
      store.setAuthorizations({
        startgg:   normalizePlatform(restored.startgg),
        challonge: normalizePlatform(restored.challonge),
        discord:   normalizePlatform(restored.discord),
        telegram:  normalizePlatform(restored.telegram),
      });
    }
  } catch (err) {
    console.warn("Failed to restore client statuses:", err);
  }

  const pruned = pruneSelections(
    integrationsSelections,
    useAppStore.getState().authorizations
  );

  store.setSettings((prev) => ({
    ...prev,
    integrationsSelections: pruned,
  }));

  store.setSelectionsHydrated(true);
}

function normalizeFormat(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return `FT${value}`;
  return String(value).toUpperCase();
}

function normalizePlatform(platform) {
  const emptySlot = () => ({
    name: "",
    clientID: "",
    secretClient: "",
    token: "",
    guildID: "",
    debugChannelID: "",
    roles: { default: "en", ru: "", en: "" },
    status: "unknown",
    statusReason: "",
  });

  const slots = Array.from({ length: 5 }, (_, i) => {
    const s = platform?.slots?.[i];
    if (!s) return emptySlot();
    const normalized = {
      ...emptySlot(),
      ...s,
      roles: { ...emptySlot().roles, ...(s.roles || {}) },
      status: s.status || "unknown",
      statusReason: s.statusReason || "",
      created: !!s.created,
    };

    if (s.lastAuthAt) {
      normalized.lastAuthAt = s.lastAuthAt;
    } else {
      delete normalized.lastAuthAt;
    }

    return normalized;
  });

  return {
    activeSlot: platform?.activeSlot ?? -1,
    slots,
  };
}