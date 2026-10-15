import {
  LoadSettingsApp,
  LoadToolsCfg,
  LoadWidgetsCfg,
  LoadAuthorizations,
  RestoreClientStatuses,
  GetActiveProfileName,
} from "../../../wailsjs/go/application/App.js";
import { useAppStore } from "../../store/useAppStore";
import { pruneSelections } from "../../utils/integrations.js";

export async function hydrateFromBackend({ markLoaded = false } = {}) {
  const store = useAppStore.getState();

  // 1. Активный профиль
  const activeProfile = await GetActiveProfileName();
  store.setActiveProfile(activeProfile || "");

  // 2. Settings
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
          standardFormat: Number(ns.rules?.standardFormat) || 2,
          finalsFormat:   Number(ns.rules?.finalsFormat)   || 3,
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
    const b = widgets.bracket ?? {};
    store.setWidgets((prev) => ({
      ...(prev ?? {}),
      bracket: {
        urlToTournament: b.urlToTournament ?? "",
        bracketId:       b.bracketId       ?? "",
        theme:           b.theme           ?? "StartGG",
        clearBackground: b.clearBackground ?? false,
        hideStages:      b.hideStages      ?? false,
        bracketMode:     b.bracketMode     ?? "all",
        scale:           typeof b.scale === "number" && b.scale > 0 ? b.scale : 1.0,
        autoRefresh:     b.autoRefresh     ?? false,
      },
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

  // Гидрация selections — ПОСЛЕ восстановления статусов
  const pruned = pruneSelections(
    integrationsSelections,
    useAppStore.getState().authorizations
  );
  store.setIntegrationsSelections(pruned);
  store.setSelectionsHydrated(true);
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