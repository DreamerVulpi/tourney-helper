import "./App.css";
import HeaderPlate from "./components/HeaderPlate.jsx";

import React, { useState, useEffect, useMemo } from "react";
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
import NotificationSystemPlate from "./components/NotificationSystemPlate.jsx";
import DatabasePlate from "./components/DatabasePlate.jsx";
import { AuthorizeStartgg, LoadSystemConfig } from "../wailsjs/go/application/App.js";
import { LoadTournamentConfig } from "../wailsjs/go/application/App.js";
import { SaveSystemConfig } from "../wailsjs/go/application/App.js";
import { SaveTournamentConfig } from "../wailsjs/go/application/App.js";
import { debounce } from './hooks/debounce.jsx';
import WidgetBracketPlate from "./components/WidgetBracketPlate.jsx";
import WidgetScoreboardPlate from "./components/WidgetScoreboardPlate.jsx";
import LoggerPlate from "./components/LoggerPlate.jsx";

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
    tournamentSlug: "",
    rules: {
      standardFormat: 2,
      finalsFormat: 3,
      stage: "Any", // TODO: Add field in windows of rules
      rounds: 3,
      duration: 60,
      crossplatform: true, // TODO: Add field in windows of rules
      waiting: 10,
    },
    stream: { area: "EU", language: "RU", connection: "Wired", passcode: "0000" }, // TODO: Add windows for editing values
    game: { name: "tekken" },
    logo: { img: "" },
    csv: { nameFile: "" },
  });

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg, type },
      ...prev,
    ]);
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

  // Init load configuration
  const [isLoaded, setIsLoaded] = useState(false);
  const [logs, setLogs] = useState([{ time: new Date().toLocaleTimeString(), msg: "Программа TourneyHelper запущена", type: "info" }]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const sys = await LoadSystemConfig();
        if (sys) {
          // Используем функциональный апдейт и spread, чтобы ничего не потерять
          setSystemCfg(prev => ({
            ...prev,
            // 1. Обработка Discord (теперь роли внутри платформы)
            discord: {
              ...prev.discord,
              ...(sys.discord || {}),
              token: sys.discord?.token || "",
              roles: {
                ru: sys.discord?.roles?.ru || "",
                en: sys.discord?.roles?.en || ""
              }
            },
            // 2. Добавляем Telegram (на будущее, по той же логике)
            telegram: {
              ...prev.telegram,
              ...(sys.telegram || {}),
              roles: {
                ru: sys.telegram?.roles?.ru || "",
                en: sys.telegram?.roles?.en || ""
              }
            },
            // 3. Отладочный режим
            debug: {
              mode: sys.debug?.mode ?? sys.Debug?.mode ?? false
            },
            // 4. База данных (в Go у тебя поле Db)
            database: {
              dsn: sys.database?.dsn || sys.db?.dsn || ""
            }
        }));
          addLog("Основная конфигурация успешно загружена", "success");
        }

        const tourney = await LoadTournamentConfig();
        if (tourney) {
          setTourneyCfg(prev => ({
            ...prev,
            // Раскрываем вложенные структуры Go
            tournamentSlug: tourney.tournamentSlug || "",
            startgg: {
              clientID: tourney.startggPlatform?.clientID || "",
              secretClient: tourney.startggPlatform?.secretClient || "",
              name: tourney.startggPlatform?.name || "startgg"
            },
            challonge: {
              clientID: tourney.challongePlatform?.clientID || "",
              secretClient: tourney.challongePlatform?.secretClient || "",
              name: tourney.challongePlatform?.name || "challonge"
            },
            logo: {
              img: tourney.logo?.img || "" 
            },
            rules: {
              // Здесь маппинг по тегам json из Go
              standardFormat: tourney.rules?.standardFormat ?? 2,
              finalsFormat: tourney.rules?.finalsFormat ?? 3,
              rounds: tourney.rules?.rounds ?? 3,
              duration: tourney.rules?.duration ?? 60,
              waiting: tourney.rules?.waiting ?? 10,
              stage: tourney.rules?.stage || "Any",
              crossplatform: tourney.rules?.crossplatform ?? true,
            },
            // Не забываем про остальные вложенные объекты, если они нужны
            stream: tourney.stream || {},
            game: tourney.game || { name: "" }
          }));
          addLog("Конфигурация турнира успешно загружена", "success");
        }
        
        setIsLoaded(true);
      } catch (err) {
        console.error("Ошибка загрузки:", err);
        addLog(err, "error");
      }
    };
    initApp();
  }, []);

  const debouncedSaveSystem = useMemo(() => debounce((cfg) => SaveSystemConfig(cfg), 1000), []);
  const debouncedSaveTourney = useMemo(() => debounce((cfg) => {
    // Безопасное приведение типов перед отправкой в Go
    const dataToSend = {
      ...cfg,
      startggPlatform: cfg.startgg || {},
      challongePlatform: cfg.challonge || {},
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
  }, 1000), []);

  const updateConfig = (type, data) => {
    if (!isLoaded) return; // Не сохраняем, пока не загрузились старые данные
    
    if (type === "system") {
      setSystemCfg((prev) => {
        const newCfg = {
          ...prev,
          ...data,
          discord: data.discord ? { ...prev.discord, ...data.discord } : prev.discord,
          debug: data.debug ? { ...prev.debug, ...data.debug } : prev.debug,
          database: data.database ? { ...prev.database, ...data.database } : prev.database,
        };
        debouncedSaveSystem(newCfg);
        return newCfg;
      });
    } else {
      setTourneyCfg((prev) => {
        const newCfg = {
          ...prev,
          ...data,
          stream: data.stream ? {...prev.stream, ...data.stream} : prev.stream,
          startgg: data.startgg ? {...prev.startgg, ...data.startgg} : prev.startgg,
          challonge: data.challonge ? {...prev.challonge, ...data.challonge} : prev.challonge,
          rules: data.rules ? { ...prev.rules, ...data.rules } : prev.rules,
        };
        debouncedSaveTourney(newCfg);
        return newCfg;
      });
    }
  };

  const authStatus = useMemo(() => {
    return {
      startgg: !!tourneyCfg.tournamentSlug, // Authorized, if len(slug) !=0  // TODO: need change to check token from file user
      discord: !!systemCfg?.discord?.token, // Authorized, if len(token) !=0  // TODO: need change to check token from file user
      telegram: false,
    };
  }, [systemCfg.discord?.token, tourneyCfg.tournamentSlug]);

  //////////////////
  // System statements
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("RU");

  const [activeTab, setActiveTab] = useState("notifications");
  //////////////////

  //////////////////
  // Status of projects
  const [statusDatabase, setStatusDatabase] = useState(true);
  const [statusSender, setStatusSender] = useState(true);
  const [statusWidgetBracket, setStatusWidgetBracket] = useState(false);
  const [statusWidgetScoreboard, setStatusWidgetScoreboard] = useState(false);
  //////////////////


  // Themes
  const themeClasses =
    theme === "dark"
      ? "bg-[#050505] text-slate-300"
      : "bg-[#f8fafc] text-slate-800";
  const cardClasses =
    theme === "dark"
      ? "bg-[#0c0c0c] border-white/5"
      : "bg-white border-slate-200 shadow-sm";
  const inputClasses =
    theme === "dark"
      ? "bg-black border-white/10 text-white"
      : "bg-slate-50 border-slate-200 text-slate-900";

  return (
    <div
      className={`flex flex-col h-screen min-w-[80rem] max-w-full overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#050505] text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <HeaderPlate
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
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
        />

        {/* MainWindow */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto p-8 relative">
              {activeTab === "notifications" && (
                <NotificationSystemPlate
                  theme={theme}
                  systemCfg={systemCfg}
                  tourneyCfg={tourneyCfg}
                  authStatus={authStatus}
                  updateConfig={updateConfig}
                  addLog={addLog}
                  handleAuth={handleAuth}
                />
              )}

              {activeTab === "database" && (
                <DatabasePlate theme={theme} statusDatabase={statusDatabase} />
              )}

              {activeTab === "bracket" && (
                <WidgetBracketPlate theme={theme} statusWidgetBracket={statusWidgetBracket}/>
              )}

              {activeTab === "scoreboard" && (
                <WidgetScoreboardPlate theme={theme} statusWidgetScoreboard={statusWidgetScoreboard}/>
              )}
          </main>

          <LoggerPlate logs={logs} setLogs={setLogs} theme={theme}/>
        </div>
      </div>
    </div>
  );
};

// --- Вспомогательные компоненты ---

const handleAuth = async (platform) => {
  try {
    addLog(`Попытка авторизации в ${platform}...`, "info");

    let success = false;

    if (platform === "discord") {
      const { clientID, secretClient } = systemCfg.discord;
      if (!clientID || !secretClient) throw new Error("Не заполнены Client ID или Secret для Discord");
      
      success = await AuthorizeDiscord(clientID, secretClient);
      
    } else if (platform === "startgg") {
      const { clientID, secretClient } = tourneyCfg.startgg;
      if (!clientID || !secretClient) throw new Error("Не заполнены данные для Start.gg");
      
      success = await AuthorizeStartgg(clientID, secretClient);
      
    } else if (platform === "challonge") {
      const { clientID, secretClient } = tourneyCfg.challonge;
      if (!clientID || !secretClient) throw new Error("Не заполнены данные для Challonge");
      
      success = await AuthorizeChallonge(clientID, secretClient);
    }

    if (success) {
      setAuthStatus(prev => ({ ...prev, [platform]: true }));
      addLog(`Авторизация в ${platform} успешна!`, "success");
    } else {
      addLog(`Авторизация в ${platform} отклонена. Проверьте правильность ключей.`, "error");
    }
  } catch (err) {
    // Выводим конкретную ошибку (например, "Не заполнены данные")
    addLog(`Ошибка [${platform}]: ${err.message || err}`, "error");
    setAuthStatus(prev => ({ ...prev, [platform]: false }));
  }
};

export default App;
