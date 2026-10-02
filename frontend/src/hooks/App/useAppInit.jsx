import { useEffect, useRef } from "react";

import {
  LoadSettingsApp,
  LoadTournamentConfig,
  LoadWidgetsConfig,
  LoadAuthorizations,
  GetActiveProfileName,
} from "../../../wailsjs/go/application/App.js";
import { useAppStore } from "../../store/useAppStore";
import { RestoreClientStatuses } from "../../../wailsjs/go/application/App";

export function useAppInit({
  locale,
  setTournament,
  setWidgets,    
  setAuthorizations,
  setActiveProfile, 
  setSettings,
  setLang,
  setTheme,
  setSidePanelCollapsed,
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

        // ============================================================
        // 3. Tournament (tournament.toml) — без widgetBracket и startgg/challonge
        // ============================================================
        const tourney = await LoadTournamentConfig();
        if (tourney) {
          setTournament((prev) => ({
            ...(prev ?? {}),
            urlToTournament: tourney.urlToTournament || "",
            logo: {
              img: tourney.logo?.img || "",
            },
            rules: {
              standardFormat: tourney.rules?.standardFormat ?? 2,
              finalsFormat:   tourney.rules?.finalsFormat   ?? 3,
              rounds:         tourney.rules?.rounds         ?? 3,
              duration:       tourney.rules?.duration       ?? 60,
              stage:          tourney.rules?.stage          || "Any",
            },
            stream: {
              area:          tourney.stream?.area          || "Any",
              language:      tourney.stream?.language      || "EN",
              connection:    tourney.stream?.connection    || "Wired",
              crossplatform: tourney.stream?.crossplatform ?? false,
              passcode:      tourney.stream?.passcode      || "0000",
              linkToLobby:   tourney.stream?.linkToLobby   || "",
            },
            csv:  tourney.csv  || { nameFile: "" },
            game: tourney.game || { name: "" },
          }));
        }

        // ============================================================
        // 4. Widgets (widgets.toml)
        // ============================================================
        const widgets = await LoadWidgetsConfig();
        if (widgets && setWidgets) {
          setWidgets({
            bracket: {
              urlToTournament: widgets.bracket?.urlToTournament || "",
              bracketId:       widgets.bracket?.bracketId       || "",
              theme:           widgets.bracket?.theme           || "Default",
              clearBackground: widgets.bracket?.clearBackground ?? false,
              hideStages:      widgets.bracket?.hideStages      ?? false,
              bracketMode:     widgets.bracket?.bracketMode     || "all",
              scale:           widgets.bracket?.scale           ?? 1.0,
              autoRefresh:     widgets.bracket?.autoRefresh     ?? false,
            },
          });
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
          })
          .catch((err) => {
            console.warn("Failed to restore client statuses:", err);
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