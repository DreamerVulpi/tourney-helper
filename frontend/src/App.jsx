import "./App.css";
import HeaderPlate from "./components/HeaderPlate.jsx";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Send,
  Users,
  Trophy,
  Monitor,
  Globe,
  Search,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Upload,
  RefreshCw,
  Copy,
  Bug,
  ShieldCheck,
  Image as ImageIcon,
  Database,
  ExternalLink,
  Play,
  Square,
  Save,
  RotateCcw,
  FileCode,
  Link as LinkIcon,
  Eye,
  UserPlus,
  Palette,
} from "lucide-react";
import SidePanel from "./components/SidePanel.jsx";
import NotificationSystemPanel from "./components/NotificationSystemPanel.jsx";
import DatabasePanel from "./components/DatabasePanel.jsx";
import {
  AuthorizeStartgg,
  LoadSystemConfig,
  LoadTournamentConfig,
  SaveSystemConfig,
  SaveTournamentConfig,
  GetUiLocale,
  LoadSettingsApp,
  SaveSettingsApp,
  GetLogs,
} from "../wailsjs/go/application/App.js";
import { debounce } from "./hooks/debounce.jsx";
import WidgetBracketPanel from "./components/WidgetBracketPanel.jsx";
import WidgetScoreboardPanel from "./components/WidgetScoreboardPanel.jsx";
import LoggerPlate from "./components/LoggerPlate.jsx";
import { EventsOn } from "../wailsjs/runtime/runtime";

const App = () => {
  const [systemCfg, setSystemCfg] = useState({
    discord: {
      token: "",
      guildID: "",
      clientID: "",
      secretClient: "",
      debugChannelID: "",
      roles: { ru: "", en: "" },
    },
    telegram: {
      token: "",
      guildID: "",
      clientID: "",
      secretClient: "",
      debugChannelID: "",
      roles: { ru: "", en: "" },
    },
    debug: { mode: false },
    database: { dsn: "" },
  });

  const [tourneyCfg, setTourneyCfg] = useState({
    startgg: { clientID: "", secretClient: "", name: "" },
    challonge: { clientID: "", secretClient: "", name: "" },
    urlToTournament: "",
    rules: {
      standardFormat: 2,
      finalsFormat: 3,
      stage: "Any", // TODO: Add field in windows of rules
      rounds: 3,
      duration: 60,
      crossplatform: true,
      waiting: 10,
    },
    stream: {
      area: "EU",
      language: "EN",
      connection: "Wired",
      passcode: "0000",
    },
    game: { name: "tekken" },
    logo: { img: "" },
    csv: { nameFile: "" },
  });

  const loadLogs = async () => {
    try {
      const logs = await GetLogs();

      const mapped = logs.map((log) => ({
        time: log.time,
        msg: locale.LogPanel?.[log.msg] || log.msg,
        type: (log.type || "info").toLowerCase(),
      }));

      setLogs(mapped.reverse());
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  };

  const addLog = (log) => {
    if (!log) return;

    setLogs((prev) => [
      {
        time: log.time || "",
        msg: log.msg || "",
        type: (log.type || "info").toLowerCase(),
      },
      ...prev,
    ]);
  };

  const getLogText = (log, locale) => {
    return locale.LogPanel?.[log.msg] || log.msg;
  };

  // Scaling
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newScale = 1;

      if (width >= 3840)
        newScale = 2; // 4K
      else if (width >= 2560)
        newScale = 1.5; // 2K
      else if (width >= 1920)
        newScale = 1; // 1080p (std)
      else if (width >= 1280)
        newScale = 0.85; // 720p
      else newScale = 0.75; // <720p

      setScale(newScale);
      document.documentElement.style.fontSize = `${16 * newScale}px`; // default font size ui
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isConfigLoadedRef = useRef(false); // Флаг: загружена ли конфигурация
  const [lang, setLang] = useState("EN");
  const [settings, setSettings] = useState(null);
  const [locale, setLocale] = useState(null);
  const [logs, setLogs] = useState([]); // Изначально пусто
  const [isMailingRunning, setIsMailingRunning] = useState(false);

  useEffect(() => {
    const loadLocalization = async () => {
      try {
        const data = await GetUiLocale(lang);
        setLocale(data);
        console.log(`${lang} - ${data.LogPanel.LocaleLoaded}`, data);

        // Добавляем приветственный лог, используя только что пришедшие данные data
        if (data?.LogPanel?.LocaleLoaded) {
          setLogs([
            {
              time: new Date().toLocaleTimeString(),
              msg: `${lang} - ${data.LogPanel.LocaleLoaded}`,
              type: "info",
            },
          ]);
        }
      } catch (err) {
        console.error(`${data.LogPanel.LocaleNotLoaded}:`, err);
      }
    };
    loadLocalization();
  }, [lang]);

  // Init load configuration
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!locale) return;

    const unsubscribe = EventsOn("logs-updated", () => {
        loadLogs();
    });

    return unsubscribe;
}, [locale]);
      

  useEffect(() => {
    if (!locale) return;

    loadLogs(locale);

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
              waiting: tourney.rules?.waiting ?? 10,
              stage: tourney.rules?.stage || "Any",
              crossplatform: tourney.rules?.crossplatform ?? true,
            },
            stream: tourney.stream || {},
            game: tourney.game || { name: "" },
          }));
        }

        const settings = await LoadSettingsApp();
        if (settings) {
          const fileLang = settings.Language || settings.language || "EN";

          setSettings((prev) => ({
            ...prev,
            Language: fileLang,
          }));

          setLang(fileLang);
        }

        isConfigLoadedRef.current = true;
        setIsLoaded(true);
      } catch (err) {
        console.error(`${locale.LogPanel.ErrorLoadingConfig}:${err}`, "error");
      }
    };

    initApp();
  }, [locale]);

  useEffect(() => {
  const unsubscribe = EventsOn("user-log", (log) => {
    setLogs(prev => [
      {
        time: log.time,
        msg: locale.LogPanel?.[log.msg] || log.msg,
        type: (log.type || "info").toLowerCase(),
      },
      ...prev,
    ]);
  });

  return unsubscribe;
}, [locale]);

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
            waiting: parseInt(cfg.rules?.waiting) || 10,
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
          console.log("Настройки приложения успешно сохранены на бэкенде");
        } catch (err) {
          console.error("Не удалось сохранить настройки приложения:", err);
        }
      }, 1000),
    [],
  );

  const updateConfig = (type, data) => {
    if (!isLoaded) return;

    if (type === "system") {
      setSystemCfg((prev) => {
        const newCfg = {
          ...prev,
          ...data,
          discord: data.discord
            ? { ...prev.discord, ...data.discord }
            : prev.discord,
          debug: data.debug ? { ...prev.debug, ...data.debug } : prev.debug,
          database: data.database
            ? { ...prev.database, ...data.database }
            : prev.database,
        };
        debouncedSaveSystem(newCfg);
        return newCfg;
      });
    } else if (type === "settings") {
      setSettings((prev) => {
        const newCfg = {
          ...prev,
          ...data,
        };
        debouncedSaveSettings(newCfg);
        return newCfg;
      });
    } else {
      setTourneyCfg((prev) => {
        const newCfg = {
          ...prev,
          ...data,
          stream: data.stream
            ? { ...prev.stream, ...data.stream }
            : prev.stream,
          startgg: data.startgg
            ? { ...prev.startgg, ...data.startgg }
            : prev.startgg,
          challonge: data.challonge
            ? { ...prev.challonge, ...data.challonge }
            : prev.challonge,
          rules: data.rules ? { ...prev.rules, ...data.rules } : prev.rules,
        };
        debouncedSaveTourney(newCfg);
        return newCfg;
      });
    }
  };

  const [authStatus, setAuthStatus] = useState({
    startgg: false,
    discord: false,
    telegram: false,
  });

  //////////////////
  // System statements
  const [isProcessing, setIsProcessing] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [activeTab, setActiveTab] = useState("notifications");
  const [activePlatform, setActivePlatform] = useState("");
  const [activeMessenger, setActiveMessenger] = useState("");
  //////////////////

  //////////////////
  // Status of projects
  const [statusDatabase, setStatusDatabase] = useState(true);
  const [statusSender, setStatusSender] = useState(true);
  const [statusWidgetBracket, setStatusWidgetBracket] = useState(false);
  const [statusWidgetScoreboard, setStatusWidgetScoreboard] = useState(false);
  //////////////////

  // Themes
  const themeClasses = {
    card:
      theme === "dark"
        ? "bg-[#111111] border-white/10 text-white"
        : "bg-white border-slate-200 text-slate-800",
    bg: theme === "dark" ? "bg-black" : "bg-slate-50",
    input:
      theme === "dark"
        ? "bg-transparent border-white/10 text-white focus:border-purple-500/50"
        : "bg-transparent border-slate-200 text-slate-700 focus:border-blue-500/50",
    label: theme === "dark" ? "text-slate-400" : "text-slate-500",
    section:
      theme === "dark"
        ? "bg-black/20 border-white/5"
        : "bg-slate-50/50 border-slate-100",
    textMuted: theme === "dark" ? "text-slate-500" : "text-slate-400",
    btnBg: theme === "dark" ? "bg-black/20" : "bg-slate-100",
  };

  return (
    <div
      className={`flex flex-col h-screen min-w-[80rem] max-w-full overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#050505] text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {!locale ? (
        <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="font-mono text-xs text-slate-400">
            Loading localization...
          </span>
        </div>
      ) : (
        <>
          <HeaderPlate
            theme={theme}
            setTheme={setTheme}
            lang={lang}
            setLang={setLang}
            updateConfig={updateConfig}
            locale={locale.HeaderPanel}
          />

          <div className="flex flex-1 overflow-hidden">
            <SidePanel
              theme={theme}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              statusDatabase={setStatusDatabase}
              statusSender={setStatusSender}
              statusWidgetBracket={setStatusWidgetBracket}
              statusWidgetScoreboard={setStatusWidgetScoreboard}
              locale={locale.SidePanel}
            />

            {/* MainWindow */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 overflow-y-auto p-8 relative">
                {activeTab === "notifications" && (
                  <NotificationSystemPanel
                    theme={theme}
                    systemCfg={systemCfg}
                    tourneyCfg={tourneyCfg}
                    authStatus={authStatus}
                    setAuthStatus={setAuthStatus}
                    updateConfig={updateConfig}
                    addLog={addLog}
                    handleAuth={handleAuth}
                    locale={locale.NotificationSystemPanel}
                    localeValidation={locale.ValidationAlertModal}
                    themeClasses={themeClasses}
                    lang={lang}
                    isStartedSending={isMailingRunning}
                    setIsStartedSending={setIsMailingRunning}
                    activePlatform={activePlatform}
                    setActivePlatform={setActivePlatform}
                    activeMessenger={activeMessenger}
                    setActiveMessenger={setActiveMessenger}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                )}

                {activeTab === "database" && (
                  <DatabasePanel
                    theme={theme}
                    statusDatabase={statusDatabase}
                    locale={locale.DatabasePanel}
                    lang={lang}
                    themeClasses={themeClasses}
                  />
                )}
                {/* In future updates */}
                {/* {activeTab === "bracket" && (
                    <WidgetBracketPanel theme={theme} statusWidgetBracket={statusWidgetBracket}/>
                  )}

                  {activeTab === "scoreboard" && (
                    <WidgetScoreboardPanel theme={theme} statusWidgetScoreboard={statusWidgetScoreboard}/>
                  )} */}
              </main>

              <LoggerPlate
                logs={logs}
                setLogs={setLogs}
                theme={theme}
                locale={locale.LogPanel}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const handleAuth = async (platform) => {
  try {
    let success = false;

    if (platform === "discord") {
      const { clientID, secretClient } = systemCfg.discord;
      if (!clientID || !secretClient)
        throw new Error(
          `${locale.NotificationSystemPanel.Platform.RequireMsg} - ${platform}`,
        );

      success = await AuthorizeDiscord(clientID, secretClient);
    } else if (platform === "startgg") {
      const { clientID, secretClient } = tourneyCfg.startgg;
      if (!clientID || !secretClient)
        throw new Error(
          `${locale.NotificationSystemPanel.Platform.RequireMsg} - ${platform}`,
        );

      success = await AuthorizeStartgg(clientID, secretClient);
    } else if (platform === "challonge") {
      const { clientID, secretClient } = tourneyCfg.challonge;
      if (!clientID || !secretClient)
        throw new Error(
          `${locale.NotificationSystemPanel.Platform.RequireMsg} - ${platform}`,
        );

      success = await AuthorizeChallonge(clientID, secretClient);
    }

    if (success) {
      setAuthStatus((prev) => ({ ...prev, [platform]: true }));
    } else {
      console.error(
        `${locale.NotificationSystemPanel.Platform.SuccessMsg} ${platform}`,
        "error",
      );
    }
  } catch (err) {
    console.error(`[${platform}]: ${err.message || err}`, "error");
    setAuthStatus((prev) => ({ ...prev, [platform]: false }));
  }
};

export default App;
