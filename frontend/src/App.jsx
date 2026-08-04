import "./App.css";

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

  // Initialization application
  useAppInit({locale, setSystemCfg, setTourneyCfg, setSettings, setLang, setIsLoaded, setTheme});
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
  const [isProcessing, setIsProcessing] = useState(false);
  // Selected panel
  const [activeTab, setActiveTab] = useState("notifications");
  // Selected tournament platform
  const [activePlatform, setActivePlatform] = useState("");
  // Selected messenger
  const [activeMessenger, setActiveMessenger] = useState("");
  // Selected game in DatabasePanel.jsx
  const [selectedGame, setSelectedGame] = useState("Tekken8");
  // State authorization for tournament platforms and messengers
  const [authStatus, setAuthStatus] = useState({
    startgg: false,
    discord: false,
    telegram: false,
  });
  // Detail description components for Light/Dark themes 
  const themeClasses = getThemeClasses(theme);
  // State for modals "About" and "Help"
  const [activeModal, setActiveModal] = useState(null);
  // State for modal "Monitoring"
  const [report, setReport] = useState({isOpen: false});

  // Status of projects
  const [isMailingRunning, setIsMailingRunning] = useState(false);

  // Statement for update modal window
  const { checking, updateInfo, error, check } = useCheckUpdate();

  useEffect(() => {
      if (!settings) return;

      check().catch(console.error);
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

  return (
    <div
      className={`flex flex-col h-screen min-w-[80rem] max-w-full overflow-hidden transition-colors duration-300 ${themeClasses.app}`}
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
          />

          <div className="flex flex-1 overflow-hidden">
            <SidePanel
              theme={theme}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
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
                    activeModal={activeModal}
                    report={report}
                    setReport={setReport}
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
                  />
                )}
                {/* In future updates */}
                {/* {activeTab === "bracket" && (
                    <WidgetBracketPanel theme={theme}/>
                  )}

                  {activeTab === "scoreboard" && (
                    <WidgetScoreboardPanel theme={theme}/>
                  )} */}
              </main>

              <LoggerPlate
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

export default App;
