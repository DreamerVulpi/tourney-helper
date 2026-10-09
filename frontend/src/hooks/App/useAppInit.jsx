import { useEffect, useRef } from "react";

import {
  LoadSettingsApp,
  LoadToolsCfg,
  LoadWidgetsCfg,
  LoadAuthorizations,
  GetActiveProfileName,
} from "../../../wailsjs/go/application/App.js";
import { useAppStore } from "../../store/useAppStore";
import { RestoreClientStatuses } from "../../../wailsjs/go/application/App";
import { pruneSelections } from "../../utils/integrations.js";

export function useAppInit({
  locale,
  setWidgets,    
  setAuthorizations,
  setActiveProfile, 
  setSettings,
  setLang,
  setTheme,
  setSidePanelCollapsed,
  setTools,
  setIntegrationsSelections,
}) {
  const isConfigLoadedRef = useRef(false);
  const setIsLoaded = useAppStore((s) => s.setIsLoaded);

  useEffect(() => {
    if (!locale) return;
    if (isConfigLoadedRef.current) return;

    const initApp = async () => {
      try {
        // ============================================================
        // 1. Активный профиль
        // ============================================================
        const activeProfile = await GetActiveProfileName();
        if (setActiveProfile) setActiveProfile(activeProfile || "");

        // ============================================================
        // 2. Настройки (settings.toml)
        // ============================================================
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

          setSettings((prev) => ({
            ...(prev ?? {}),
            Language: lang,
            Theme: theme,
            CheckUpdatesOnStartUp: checkUpdatesOnStartUp,
            IgnoredVersion: ignoredVersion,
            SidePanelCollapsed: sidePanelCollapsed,
            DebugMode: debugMode,
          }));

          setLang(lang);
          setTheme(theme);
          setSidePanelCollapsed(sidePanelCollapsed);
        }

      const tools = await LoadToolsCfg();
      console.log("[useAppInit] tools from backend:", tools);
      if (tools) {
        const ns = tools?.notificationSystem ?? {};
        console.log("[useAppInit] tools.notificationSystem:", tools.notificationSystem);
        setTools((prev) => ({
          ...(prev ?? {}),
          notificationSystem: {
            deliveryClients:    ns.deliveryClients    ?? [],

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
            csv:  { nameFile: ns.csv?.nameFile ?? "" },
            game: { name: ns.game?.name ?? "tekken" },
          },
        }));
      }

        // ============================================================
        // 4. Widgets (widgets.toml)
        // ============================================================
        const widgets = await LoadWidgetsCfg();
        if (widgets) {
          const b = widgets.bracket ?? {};
          setWidgets((prev) => ({
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

        // ============================================================
        // 5. Authorizations (authorizations.toml)
        // ============================================================
        const auths = await LoadAuthorizations();
        if (auths && setAuthorizations) {
          setAuthorizations({
            startgg:   normalizePlatform(auths.startgg),
            challonge: normalizePlatform(auths.challonge),
            discord:   normalizePlatform(auths.discord),
            telegram:  normalizePlatform(auths.telegram),
          });
            setAuthorizations((prev) => {
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

                 isConfigLoadedRef.current = true;
         setIsLoaded(true);
         RestoreClientStatuses()
           .then((restored) => {
             if (restored && setAuthorizations) {
               setAuthorizations({
                 startgg:   normalizePlatform(restored.startgg),
                 challonge: normalizePlatform(restored.challonge),
                 discord:   normalizePlatform(restored.discord),
                 telegram:  normalizePlatform(restored.telegram),
               });
             }

           // Гидрация selections — ПОСЛЕ восстановления статусов
           if (setIntegrationsSelections) {
             const pruned = pruneSelections(
               integrationsSelections,
               useAppStore.getState().authorizations
             );
             setIntegrationsSelections(pruned);
             useAppStore.getState().setSelectionsHydrated(true);
           }
           })
           .catch((err) => {
             console.warn("Failed to restore client statuses:", err);

           // Даже при ошибке — гидратируем, иначе потеряем сохранённый выбор
           if (setIntegrationsSelections) {
             const pruned = pruneSelections(
               integrationsSelections,
               useAppStore.getState().authorizations
             );
             setIntegrationsSelections(pruned);
             useAppStore.getState().setSelectionsHydrated(true);
           }
           });
      } catch (err) {
        console.error(`${locale.LogPanel.ErrorLoadingConfig}:${err}`, "error");
      }
    };
    
    

    initApp();
  }, [locale]);
}

// Приводит структуру PlatformAuthorizations к стабильному виду.
// Гарантирует, что slots — всегда массив из 5 элементов.
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