import "./App.css";

import { useState, useEffect, useMemo, useRef } from "react";

import HeaderPlate from "./pages/HeaderPlate.jsx";
import SidePanel from "./pages/SidePanel.jsx";
import NotificationSystemPanel from "./pages/NotificationSystemPanel.jsx";
import DatabasePanel from "./pages/DatabasePanel.jsx";
import WidgetBracketPanel from "./pages/WidgetBracketPanel.jsx";
import WidgetScoreboardPanel from "./pages/WidgetScoreboardPanel.jsx";
import LoggerPlate from "./pages/LoggerPlate.jsx";


import { useScale } from "./hooks/App/useScale.jsx";
import { useLocale } from "./hooks/App/useLocale.jsx";
import { useAppInit } from "./hooks/App/useAppInit.jsx"
import { useAutoSave } from "./hooks/App/useAutoSave.jsx";
import { useConfigUpdater } from "./hooks/App/useConfigUpdater.jsx";
import { getThemeClasses } from "./utils/themeClasses.jsx";
import { useThemeClasses } from "./hooks/App/useThemeClasses";
import { useCheckUpdate } from "./hooks/App/useCheckUpdate.jsx";
import { InstallUpdate } from "../wailsjs/go/application/App.js";
import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime.js"
import { useAppStore } from "./store/useAppStore"

const App = () => {
  // ---- UI ----
  const theme          = useAppStore((s) => s.theme);
  const setTheme       = useAppStore((s) => s.setTheme);
  const lang           = useAppStore((s) => s.lang);
  const setLang        = useAppStore((s) => s.setLang);
  const { locale }     = useLocale();
  const activeTab      = useAppStore((s) => s.activeTab);
  const setActiveTab   = useAppStore((s) => s.setActiveTab);
  const activeModal    = useAppStore((s) => s.activeModal);
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const activeAuthorizationSettings    = useAppStore((s) => s.activeAuthorizationSettings);
  const setActiveAuthorizationSettings = useAppStore((s) => s.setActiveAuthorizationSettings);

  // ---- Side panel ----
  const sidePanelCollapsed    = useAppStore((s) => s.sidePanelCollapsed);
  const setSidePanelCollapsed = useAppStore((s) => s.setSidePanelCollapsed);
  const isSidePanelHovered    = useAppStore((s) => s.isSidePanelHovered);
  const setIsSidePanelHovered = useAppStore((s) => s.setIsSidePanelHovered);

  // ---- Statuses ----
  const statusNotificationSystem    = useAppStore((s) => s.statusNotificationSystem);
  const setStatusNotificationSystem = useAppStore((s) => s.setStatusNotificationSystem);
  const statusDatabase              = useAppStore((s) => s.statusDatabase);
  const setStatusDatabase           = useAppStore((s) => s.setStatusDatabase);
  const statusWidgetBracket         = useAppStore((s) => s.statusWidgetBracket);
  const setStatusWidgetBracket      = useAppStore((s) => s.setStatusWidgetBracket);

  // ---- Selection ----
  const activeTournamentPlatform    = useAppStore((s) => s.activeTournamentPlatform);
  const setActiveTournamentPlatform = useAppStore((s) => s.setActiveTournamentPlatform);
  const activeDeliveryMethod        = useAppStore((s) => s.activeDeliveryMethod);
  const setActiveDeliveryMethod     = useAppStore((s) => s.setActiveDeliveryMethod);
  const selectedGame                = useAppStore((s) => s.selectedGame);
  const setSelectedGame             = useAppStore((s) => s.setSelectedGame);

  // ---- Configs ----
  const settings      = useAppStore((s) => s.settings);
  const setSettings   = useAppStore((s) => s.setSettings);
  const systemCfg     = useAppStore((s) => s.systemCfg);
  const setSystemCfg  = useAppStore((s) => s.setSystemCfg);
  const tourneyCfg    = useAppStore((s) => s.tourneyCfg);
  const setTourneyCfg = useAppStore((s) => s.setTourneyCfg);
  const authStatus    = useAppStore((s) => s.authStatus);
  const setAuthStatus = useAppStore((s) => s.setAuthStatus);

  // Scale UI
  const scale = useScale();
  const [isLoaded, setIsLoaded] = useState(false);

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
  
  // Detail description components for Light/Dark themes 
  const themeClasses = useThemeClasses(getThemeClasses);
  // State for modal "Monitoring"
  const [report, setReport] = useState({isOpen: false});


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

  const [urlValidationWidgetBracket, setURLValidationWidgetBracket] = useState({
      valid: null,
      platform: '',
  });

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
              locale={locale.SidePanel}
              updateConfig={updateConfig}
            />
          </div>
          <HeaderPlate
            locale={locale.HeaderPanel}
            updateConfig={updateConfig}
            updateInfo={updateInfo}
            check={check}
            handleInstallUpdate={handleInstallUpdate}
            updateProgressOpen={updateProgressOpen}
            updateStatus={updateStatus}
            updateMessage={updateMessage}
            updateProgress={updateProgress}
            setUpdateProgressOpen={setUpdateProgressOpen}
            setUpdateMessage={setUpdateMessage}
            setUpdateProgress={setUpdateProgress}
          />

          {/* MainWindow */}
            <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-8 relative">
                {activeTab === "notifications" && (
                  <NotificationSystemPanel
                    locale={locale.NotificationSystemPanel}
                    localeValidation={locale.ValidationAlertModal}
                    updateConfig={updateConfig}
                    isStartedSending={isMailingRunning}
                    setIsStartedSending={setIsMailingRunning}
                    isProcessing={isProcessingNS}
                    setIsProcessing={setIsProcessing}
                    report={report}
                    setReport={setReport}
                  />
                )}

                {activeTab === "database" && (
                  <DatabasePanel
                    locale={locale.DatabasePanel}
                  />
                )}
                {activeTab === "widgetBracket" && (
                  <WidgetBracketPanel
                    locale={locale.WidgetBracketPanel}
                    updateConfig={updateConfig}
                    isProcessing={isProcessingWB}
                    setIsProcessingWB={setIsProcessingWB}
                    isWidgetBracketRunning={isWidgetBracketRunning}
                    setIsWidgetBracketRunning={setIsWidgetBracketRunning}
                    bracketFlags={bracketFlags}
                    setBracketFlags={setBracketFlags}
                    urlValidation={urlValidationWidgetBracket}
                    setURLValidation={setURLValidationWidgetBracket}
                  />
                )}
                {/* In future updates */}
                {/*
                  {activeTab === "scoreboard" && (
                    <WidgetScoreboardPanel theme={theme}/>
                  )} */}
              </main>

              <LoggerPlate
                locale={locale.LogPanel}
              />
            </div>
        </>
      )}
    </div>
  );
};

export default App;
