import "./App.css";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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

import HeaderPlate from "./pages/HeaderPlate.jsx";
import SidePanel from "./pages/SidePanel.jsx";
import NotificationSystemPanel from "./pages/NotificationSystemPanel.jsx";
import DatabasePanel from "./pages/DatabasePanel.jsx";
import WidgetBracketPanel from "./pages/WidgetBracketPanel.jsx";
import WidgetScoreboardPanel from "./pages/WidgetScoreboardPanel.jsx";
import LoggerPlate from "./pages/LoggerPlate.jsx";

import { useSystemConfig, useTourneyConfig } from "./hooks/App/useConfig.jsx";

import { useScale } from "./hooks/App/useScale.jsx";
import { useLocale } from "./hooks/App/useLocale.jsx";
import { useAppInit } from "./hooks/App/useAppInit.jsx"
import { useAutoSave } from "./hooks/App/useAutoSave.jsx";
import { useConfigUpdater } from "./hooks/App/useConfigUpdater.jsx";
import { getThemeClasses } from "./utils/themeClasses.jsx";
import { useCheckUpdate } from "./hooks/App/useCheckUpdate.jsx";
import { InstallUpdate } from "../wailsjs/go/application/App.js";
import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime.js"
import { SERVICE_STATUS } from "./utils/listStatus.js";

const App = () => {
  // Scale UI
  const scale = useScale();

  // Variables for configs 
  const [settings, setSettings] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState("dark");
  
  // Load configs
  const { systemCfg, setSystemCfg } = useSystemConfig();
  const { tourneyCfg, setTourneyCfg } = useTourneyConfig();

  // Load locale
  const {lang, locale, setLang } = useLocale("EN")

  // Side panel
  const [isSidePanelHovered, setIsSidePanelHovered] = useState(false);
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(null);
  const [statusNotificationSystem, setStatusNotificationSystem] = useState(SERVICE_STATUS.OFF);
  const [statusDatabase, setStatusDatabase] = useState(SERVICE_STATUS.RUNNING);
  const [statusWidgetBracket, setStatusWidgetBracket] = useState(SERVICE_STATUS.OFF);

  // Initialization application
  useAppInit({locale, setSystemCfg, setTourneyCfg, setSettings, setLang, setIsLoaded, setTheme, setSidePanelCollapsed});
  // Delay before save data from fields in configs
  const {debouncedSaveSystem, debouncedSaveTourney, debouncedSaveSettings} = useAutoSave();
  const { updateConfig } = useConfigUpdater({
    isLoaded,
    setSystemCfg,
    setTourneyCfg,
    setSettings,
    debouncedSaveSystem,
    debouncedSaveTourney,
    debouncedSaveSettings,
  });
  
  // System variables

  // Status of the messaging system
  const [isProcessingNS, setIsProcessing] = useState(false);
  const [isProcessingWB, setIsProcessingWB] = useState(false);
  // Selected panel
  const [activeTab, setActiveTab] = useState("notifications");
  // Selected tournament platform
  const [activeTournamentPlatform, setActiveTournamentPlatform] = useState("");
  // Selected messenger
  const [activeDeliveryMethod, setActiveDeliveryMethod] = useState("");
  // Selected game in DatabasePanel.jsx
  const [selectedGame, setSelectedGame] = useState("Tekken8");
  // State authorization for tournament platforms and messengers
  const [authStatus, setAuthStatus] = useState({
    startgg: false,
    discord: false,
    telegram: false,
  });
  // Detail description components for Light/Dark themes 
  const themeClasses = useMemo(() => getThemeClasses(theme), [theme]);
  // State for modals "About" and "Help"
  const [activeModal, setActiveModal] = useState(null);
  // State for modal "Monitoring"
  const [report, setReport] = useState({isOpen: false});
  // Variables for settings authorizations
  const [activeAuthorizationSettings, setActiveAuthorizationSettings] = useState(null);

  // Status of projects
  const [isMailingRunning, setIsMailingRunning] = useState(false);
  const [isWidgetBracketRunning, setIsWidgetBracketRunning] = useState(false);

  // Statement for update modal window
  const { checking, updateInfo, error, check } = useCheckUpdate();
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("idle");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateProgress, setUpdateProgress] = useState(0);

  const handleInstallUpdate = async () => {
    setUpdateStatus("loading");
    setUpdateProgress(0);
    setUpdateMessage(
      locale.ProgressModal.Download
    );
    setUpdateProgressOpen(true);

    try {
      await InstallUpdate();
    } catch (err) {
      const errorText =
        err?.message ||
        err?.toString() ||
        "Unknown error";

      setUpdateStatus("error");
      setUpdateMessage(
        `${locale.ProgressModal.Error} ${errorText}`
      );
    }
  };

  // Дефолтные флаги
const DEFAULT_BRACKET_FLAGS = {
    transparent: false,
    hideRounds:  false,
    bracketMode: 'all',
    scale:       1.0,
};

const [bracketFlags, setBracketFlags] = useState(DEFAULT_BRACKET_FLAGS);

// Флаг: инициализированы ли мы из конфига
const bracketFlagsInitializedRef = useRef(false);

// 1. Инициализация из конфига — как только он загрузился
useEffect(() => {
    if (bracketFlagsInitializedRef.current) return;
    if (!tourneyCfg?.widgetBracket) return;

    const { clearBackground, hideStages, bracketMode, scale } = tourneyCfg.widgetBracket;
    console.log('[App] init bracketFlags from config:', {
        clearBackground, hideStages, bracketMode, scale,
    });

    setBracketFlags({
        transparent: !!clearBackground,
        hideRounds:  !!hideStages,
        bracketMode: bracketMode || 'all',
        scale:       typeof scale === 'number' && scale > 0 ? scale : 1.0,
    });

    bracketFlagsInitializedRef.current = true;
}, [tourneyCfg]);

// 2. Сохранение в конфиг — только после инициализации
useEffect(() => {
    if (!bracketFlagsInitializedRef.current) {
        console.log('[App] skip saving flags — config not initialized yet');
        return;
    }

    console.log('[App] save bracketFlags to config:', bracketFlags);

    updateConfig("tournament", {
        widgetBracket: {
            ...tourneyCfg?.widgetBracket,
            clearBackground: bracketFlags.transparent,
            hideStages:      bracketFlags.hideRounds,
            bracketMode:     bracketFlags.bracketMode,
            scale:           bracketFlags.scale,
        },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [bracketFlags]);

// 3. Сохранение в localStorage + BroadcastChannel + backend (с debounce)
useEffect(() => {
    if (!bracketFlagsInitializedRef.current) return;

    const timer = setTimeout(() => {
        // localStorage
        try {
            localStorage.setItem('bracket:flags', JSON.stringify(bracketFlags));
        } catch (e) {}

        // BroadcastChannel
        let channel = null;
        try {
            channel = new BroadcastChannel('bracket:flags');
            channel.postMessage({
                type: 'bracket:flags-changed',
                flags: bracketFlags,
            });
            channel.close();
        } catch (e) {}

        // Backend
        fetch('http://localhost:8080/widget/bracket/flags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bracketFlags),
        }).catch(err => {
            console.warn('[App] POST bracket flags failed:', err);
        });
    }, 300);

    return () => clearTimeout(timer);
}, [bracketFlags]);

  useEffect(() => {
      const timer = setTimeout(() => {
          // 1. localStorage
          try {
              localStorage.setItem('bracket:flags', JSON.stringify(bracketFlags));
          } catch (e) {}

          // 2. BroadcastChannel
          let channel = null;
          try {
              channel = new BroadcastChannel('bracket:flags');
              channel.postMessage({
                  type: 'bracket:flags-changed',
                  flags: bracketFlags,
              });
              channel.close();
          } catch (e) {}

          // 3. Backend
          fetch('http://localhost:8080/widget/bracket/flags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bracketFlags),
          }).catch(err => {
              console.warn('[App] POST bracket flags failed:', err);
          });
      }, 300);

      return () => clearTimeout(timer);
  }, [bracketFlags]);

  useEffect(() => {
      if (!settings) return;
      if (settings?.CheckUpdatesOnStartUp) {
          check().catch(console.error);
      }
  }, [check, settings?.IgnoredVersion]);

  useEffect(() => {
      if (!settings) return;
      if (!updateInfo?.Available) return;

      if (settings.IgnoredVersion === updateInfo.Latest.Version) return;
      if (!settings.CheckUpdatesOnStartUp) return;

      const timer = setTimeout(() => {
          setActiveModal("update");
      }, 1000);

      return () => clearTimeout(timer);
  }, [updateInfo, settings?.IgnoredVersion, settings?.CheckUpdatesOnStartUp]);

  useEffect(() => {
    const unsubscribe = EventsOn(
      "update-download-progress",
      (downloaded, total) => {
        if (!total || total <= 0) {
          return;
        }

        const progress = Math.round((downloaded / total) * 100);

        setUpdateProgress(progress);
      }
    );

    return () => {
      EventsOff("update-download-progress");
    };
  }, []);

    useEffect(() => {
    EventsOn("update-status", (status) => {
      switch (status) {
        case "extracting":
          setUpdateStatus("loading");
          setUpdateMessage(locale.ProgressModal.Extract);
          break;

        case "installing":
          setUpdateStatus("loading");
          setUpdateMessage(locale.ProgressModal.Install);
          break;

        case "restarting":
          setUpdateStatus("loading");
          setUpdateMessage(locale.ProgressModal.Restart);
          break;
      }
    });

    return () => {
      EventsOff("update-status");
    };
  }, [locale]);

  const iframeRef_WidgetBracket = useRef(null);


  return (
    <div
    className={`grid grid-cols-[auto_1fr] grid-rows-[4rem_1fr] h-screen min-w-[80rem] max-w-full overflow-hidden transition-colors duration-300 ${themeClasses.app}`}
  >
    {!locale ? (
      <div className="col-span-2 h-screen w-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>

        <span className="font-mono text-xs text-slate-400">
          Loading localization...
        </span>
      </div>
      ) : (
        <>
          <div className="row-span-2 min-h-0">
            <SidePanel
              theme={theme}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              locale={locale.SidePanel}
              collapsed={sidePanelCollapsed}
              setCollapsed={setSidePanelCollapsed}
              setIsHovered={setIsSidePanelHovered}
              statusNotificationSystem={statusNotificationSystem}
              statusDatabase={statusDatabase}
              statusWidgetBracket={statusWidgetBracket}
              isSidePanelHovered={isSidePanelHovered}
              sidePanelCollapsed={sidePanelCollapsed}
              setSidePanelCollapsed={setSidePanelCollapsed}
              updateConfig={updateConfig}
              settings={settings}
            />
          </div>
          <HeaderPlate
            authStatus={authStatus}
            setAuthStatus={setAuthStatus}
            theme={theme}
            setTheme={setTheme}
            lang={lang}
            setLang={setLang}
            activeTab={activeTab}
            updateConfig={updateConfig}
            updateInfo={updateInfo}
            check={check}
            locale={locale.HeaderPanel}
            themeClasses={themeClasses}
            activeModal={activeModal}
            setActiveModal={setActiveModal}
            settings={settings}
            setSettings={setSettings}
            handleInstallUpdate={handleInstallUpdate}
            updateProgressOpen={updateProgressOpen}
            updateStatus={updateStatus}
            updateMessage={updateMessage}
            updateProgress={updateProgress}
            setUpdateProgressOpen={setUpdateProgressOpen}
            setUpdateStatus={setUpdateStatus}
            setUpdateMessage={setUpdateMessage}
            setUpdateProgress={setUpdateProgress}

            systemCfg={systemCfg}
            tourneyCfg={tourneyCfg}

            activeTournamentPlatform={activeTournamentPlatform}
            setActiveTournamentPlatform={setActiveTournamentPlatform}
            activeDeliveryMethod={activeDeliveryMethod}
            setActiveDeliveryMethod={setActiveDeliveryMethod}
            activeAuthorizationSettings={activeAuthorizationSettings}
            setActiveAuthorizationSettings={setActiveAuthorizationSettings}
          />

          {/* MainWindow */}
            <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-8 relative">
                {activeTab === "notifications" && (
                  <NotificationSystemPanel
                    theme={theme}
                    systemCfg={systemCfg}
                    tourneyCfg={tourneyCfg}
                    authStatus={authStatus}
                    setAuthStatus={setAuthStatus}
                    updateConfig={updateConfig}
                    locale={locale.NotificationSystemPanel}
                    localeValidation={locale.ValidationAlertModal}
                    themeClasses={themeClasses}
                    lang={lang}
                    isStartedSending={isMailingRunning}
                    setIsStartedSending={setIsMailingRunning}
                    activePlatform={activeTournamentPlatform}
                    setActivePlatform={setActiveTournamentPlatform}
                    activeMessenger={activeDeliveryMethod}
                    setActiveMessenger={setActiveDeliveryMethod}
                    isProcessing={isProcessingNS}
                    setIsProcessing={setIsProcessing}
                    activeModal={activeModal}
                    report={report}
                    setReport={setReport}
                    setStatusNotificationSystem={setStatusNotificationSystem}
                  />
                )}

                {activeTab === "database" && (
                  <DatabasePanel
                    theme={theme}
                    locale={locale.DatabasePanel}
                    lang={lang}
                    themeClasses={themeClasses}
                    selectedGame={selectedGame}
                    setSelectedGame={setSelectedGame}
                    setStatusDatabase={setStatusDatabase}
                    sidePanelCollapsed={sidePanelCollapsed}
                  />
                )}
                {activeTab === "widgetBracket" && (
                  <WidgetBracketPanel 
                    theme={theme}
                    locale={locale.WidgetBracketPanel}
                    themeClasses={themeClasses}
                    activeModal={activeModal}
                    activePlatform={activeTournamentPlatform}
                    tourneyCfg={tourneyCfg}
                    updateConfig={updateConfig}
                    isProcessing={isProcessingWB}
                    isWidgetBracketRunning={isWidgetBracketRunning}
                    setIsWidgetBracketRunning={setIsWidgetBracketRunning}
                    setStatusWidgetBracket={setStatusWidgetBracket}
                    setIsProcessingWB={setIsProcessingWB}        
                    iframeRef_WidgetBracket={iframeRef_WidgetBracket}
                    bracketFlags={bracketFlags}
                    setBracketFlags={setBracketFlags}    
                  />
                )}
                {/* In future updates */}
                {/*
                  {activeTab === "scoreboard" && (
                    <WidgetScoreboardPanel theme={theme}/>
                  )} */}
              </main>

              <LoggerPlate
                theme={theme}
                locale={locale.LogPanel}
              />
            </div>
        </>
      )}
    </div>
  );
};

export default App;
