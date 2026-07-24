import { useEffect, useRef } from "react";

import {
  LoadSystemConfig,
  LoadTournamentConfig,
  LoadSettingsApp
} from "../../../wailsjs/go/application/App.js";

export function useAppInit({
    locale, setSystemCfg, setTourneyCfg, setSettings, setLang, setIsLoaded, setTheme,
}) {
    const isConfigLoadedRef = useRef(false);
    useEffect(() => {
        if (!locale) return;
  
    
        if (isConfigLoadedRef.current) return;
    
        const initApp = async () => {
          try {
            const sys = await LoadSystemConfig();
            if (sys) {
              setSystemCfg((prev) => ({
                ...prev,
                discord: {
                  ...prev.discord,
                  ...(sys.discord || {}),
                  token: sys.discord?.token || "",
                  roles: {
                    ru: sys.discord?.roles?.ru || "",
                    en: sys.discord?.roles?.en || "",
                  },
                },
                telegram: {
                  ...prev.telegram,
                  ...(sys.telegram || {}),
                  roles: {
                    ru: sys.telegram?.roles?.ru || "",
                    en: sys.telegram?.roles?.en || "",
                  },
                },
                debug: {
                  mode: sys.debug?.mode ?? sys.Debug?.mode ?? false,
                },
                database: {
                  dsn: sys.database?.dsn || sys.db?.dsn || "",
                },
              }));
            }
    
            const tourney = await LoadTournamentConfig();
            if (tourney) {
              setTourneyCfg((prev) => ({
                ...prev,
                urlToTournament: tourney.urlToTournament || "",
                startgg: {
                  clientID: tourney.startgg?.clientID || "",
                  secretClient: tourney.startgg?.secretClient || "",
                  name: tourney.startgg?.name || "startgg",
                },
                challonge: {
                  clientID: tourney.challonge?.clientID || "",
                  secretClient: tourney.challonge?.secretClient || "",
                  name: tourney.challonge?.name || "challonge",
                },
                logo: {
                  img: tourney.logo?.img || "",
                },
                rules: {
                  standardFormat: tourney.rules?.standardFormat ?? 2,
                  finalsFormat: tourney.rules?.finalsFormat ?? 3,
                  rounds: tourney.rules?.rounds ?? 3,
                  duration: tourney.rules?.duration ?? 60,
                  stage: tourney.rules?.stage || "Any",
                  crossplatform: tourney.rules?.crossplatform ?? true,
                },
                stream: tourney.stream || {},
                game: tourney.game || { name: "" },
              }));
            }
    
            const settings = await LoadSettingsApp();
            if (settings) {
              const lang = settings.Language || settings.language || "EN";
              const theme = settings.Theme || settings.theme || "dark";
    
              setSettings((prev) => ({
                ...prev,
                Language: lang,
                Theme: theme,
              }));
    
              setLang(lang);
              setTheme(theme);
            }
    
            isConfigLoadedRef.current = true;
            setIsLoaded(true);
          } catch (err) {
            console.error(`${locale.LogPanel.ErrorLoadingConfig}:${err}`, "error");
          }
        };
    
        initApp();
      }, [locale]);
}