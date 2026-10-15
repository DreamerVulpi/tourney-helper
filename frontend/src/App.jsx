import "./App.css";

import { useState, useEffect, useRef } from "react";

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
import { useBracketFlagsSync } from "./hooks/App/useBracketFlagsSync.jsx";
import { useAppStore } from "./store/useAppStore"
import IntegrationsPlate from "./pages/IntegrationsPanel.jsx";
import ProfilesPanel from "./pages/ProfilesPanel.jsx";

const App = () => {
  // ---- UI ----
  const setTheme       = useAppStore((s) => s.setTheme);
  const setLang        = useAppStore((s) => s.setLang);
  const { locale }     = useLocale();
  const activeTab      = useAppStore((s) => s.activeTab);
  const setActiveModal = useAppStore((s) => s.setActiveModal);

  // ---- Side panel ----
  const setSidePanelCollapsed = useAppStore((s) => s.setSidePanelCollapsed);

  // ---- Configs ----
  const settings      = useAppStore((s) => s.settings);
  const widgets       = useAppStore((s) => s.widgets);
  const tools    = useAppStore((s) => s.tools);
  const authorizations = useAppStore((s) => s.authorizations);
  const selections = useAppStore((s) => s.integrationsSelections);
  const selectionsHydrated = useAppStore((s) => s.selectionsHydrated);

  const setSettings   = useAppStore((s) => s.setSettings);
  const setWidgets = useAppStore((s) => s.setWidgets);
  const setAuthorizations = useAppStore((s) => s.setAuthorizations);
  const setActiveProfile = useAppStore((s) => s.setActiveProfile);
  const setTools = useAppStore((s) => s.setTools);
  const setIntegrationsSelections = useAppStore((s) => s.setIntegrationsSelections);

  // Scale UI
  const scale = useScale();
  const isLoaded = useAppStore((s) => s.isLoaded);

  const {
    debouncedSaveSettings,
    debouncedSaveWidgets,
    debouncedSaveAuthorizations,
    debouncedSaveTools,
  } = useAutoSave();

  const { updateConfig } = useConfigUpdater({
    isLoaded,
    debouncedSaveSettings,
    debouncedSaveWidgets,
    debouncedSaveAuthorizations,
    debouncedSaveTools,
  });

  useBracketFlagsSync();

  // Сохраняем выбор клиентов при каждом изменении
  useEffect(() => {
    if (!isLoaded) return;
    if (!selectionsHydrated) return;
    updateConfig("settings", { integrationsSelections: selections });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, isLoaded, selectionsHydrated]);

  // Initialization application
  useAppInit({
    locale
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
  const { updateInfo, check } = useCheckUpdate();
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

                {activeTab === "dbPlayers" && (
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
                    iframeRef_WidgetBracket={iframeRef_WidgetBracket}
                    urlValidation={urlValidationWidgetBracket}
                    setURLValidation={setURLValidationWidgetBracket}
                  />
                )}

                {activeTab === "integrations" && (
                  <IntegrationsPlate
                    locale={locale.IntegrationsPanel}
                    updateConfig={updateConfig}
                  />
                )}
                {activeTab === "profiles" && (
                  <ProfilesPanel
                    locale={locale.ProfilesPanel}
                    updateConfig={updateConfig}
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
