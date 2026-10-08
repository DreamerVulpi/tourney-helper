import { useCallback, useState } from "react";
import {
  Bug,
  Search,
  FileSignature,
  Image as ImageIcon,
  Key,
  ImagePlus,
  Settings2,
  Trophy,
  Timer,
  Monitor,
  Zap,
  Cpu,
  Globe,
  Map,
} from "lucide-react";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";
import { changeRule } from "../utils/NotificationSystemPanel.jsx/changeRule.jsx";
import { useStartSendingToggle } from "../hooks/NotificationSystemPanel/useStartSendingToggle.jsx";
import { Field } from "../components/ui/Field.jsx";
import { ToggleSwitch } from "../components/ui/ToggleSwitch.jsx";
import { ValidationModal } from "../components/ValidationModal.jsx";
import  NotificationMonitorModal from "../components/modals/NotificationMonitorModal.jsx"
import { useMessengerAuth } from "../hooks/useMessengerAuth.jsx";
import { useTournamentPlatform } from "../hooks/useTournamentPlatform.jsx";
import { durationItems, listFT } from "../utils/NotificationSystemPanel.jsx/lists.js";
import { listGames } from "../utils/listGames.js";
import { ButtonFooter } from "../components/ui/ButtonFooter.jsx";
import { NotificationButton } from "../hooks/NotificationSystemPanel/useButtonFooter.jsx";
import { locales } from "../utils/listLocales.js";
import { useThemeClasses } from "../hooks/App/useThemeClasses"
import { getThemeClasses } from "../utils/themeClasses";
import { useAppStore } from "../store/useAppStore";

const NotificationSystemPlate = ({
  locale,
  localeValidation,
  updateConfig,
  isStartedSending,
  setIsStartedSending,
  isProcessing,
  setIsProcessing,
  report,
  setReport,
}) => {
  const notificationSystem = useAppStore((s) => s.tools?.notificationSystem);
  const theme        = useAppStore((s) => s.theme);
  const lang         = useAppStore((s) => s.lang);
  const systemCfg    = useAppStore((s) => s.systemCfg);
  const settings = useAppStore((s) => s.settings);
  const authFlags   = useAppStore((s) => s.authFlags);
  const setAuthFlags = useAppStore((s) => s.setAuthFlags);
  const activeModal  = useAppStore((s) => s.activeModal);

  const activePlatform    = useAppStore((s) => s.activeTournamentPlatform);
  const setActivePlatform = useAppStore((s) => s.setActiveTournamentPlatform);
  const activeDeliveryMethod    = useAppStore((s) => s.activeDeliveryMethod);
  const setActiveDeliveryMethod = useAppStore((s) => s.setActiveDeliveryMethod);

  const setStatusNotificationSystem = useAppStore((s) => s.setStatusNotificationSystem);
  const themeClasses = useThemeClasses(getThemeClasses);

  // Get data from configs
  const debugMode = settings?.DebugMode ?? false;

  const urlToTournament = notificationSystem?.urlToTournament ?? "";
  const gameName        = notificationSystem?.game?.name ?? "tekken";
  const stage           = notificationSystem?.rules?.stage ?? "Random";
  const rules = notificationSystem?.rules ?? {
    standardFormat: 2,
    finalsFormat:   3,
    rounds:         3,
    duration:       60,
    stage,
  };
  const passcode    = notificationSystem?.stream?.passcode    ?? "0000";
  const linkToLobby = notificationSystem?.stream?.linkToLobby ?? "";
  const streamLobby = notificationSystem?.stream ?? {
    area: "Any",
    language: "Any",
    conn: "Any",
    crossplatform: true,
    passcode,
    linkToLobby,
  };
  const urlLogoTournament = notificationSystem?.logo?.img ?? "";
  const previewLogo = urlLogoTournament || "https://raw.githubusercontent.com/DreamerVulpi/tourney-helper/main/branding/icons/256.png"

  // State for ready of notification system
  const isReadyToStart =
    activePlatform &&
    authFlags?.[activePlatform] &&
    activeDeliveryMethod &&
    authFlags?.[activeDeliveryMethod] &&
    urlToTournament && gameName;
  // State for selected tab: Tournament Rules || Live Broadcast Lobby
  const [activeTab, setActiveTab] = useState("rules"); // "rules" or "lobby"
  // State for revial validation alert
  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });

  // Handler for start proccess - Sending notifications
  const handleStartedSendingToggle = useStartSendingToggle(
    isStartedSending,
    setIsStartedSending,
    isProcessing,
    setIsProcessing,
    setReport,
    setStatusNotificationSystem,
    { activeDeliveryMethod: activeDeliveryMethod, activePlatform, systemCfg, notificationSystem, lang },
  );

  const handleTournamentUrlChange = useCallback((value) => {
    updateConfig("tools", {
      notificationSystem: {
        urlToTournament: value,
      },
    });
  }, [updateConfig]);
  const handleDebugModeChange = useCallback((value) => {
    updateConfig("settings", {
      DebugMode: value,
    });
  }, [updateConfig]);

  // Button style for handler which start proccess
  const getButtonStyle = getLaunchButtonStyle(isStartedSending, debugMode);

  const handleStandardFormatChange = useCallback((value) => {
    changeRule("standardFormat", value, updateConfig);
  }, [updateConfig]);

  const handleFinalsFormatChange = useCallback((value) => {
    changeRule("finalsFormat", value, updateConfig);
  }, [updateConfig]);

  const handleRoundsChange = useCallback((value) => {
    const rounds = Math.min(5, Math.max(1, Number(value) || 1));
    changeRule("rounds", rounds, updateConfig);
  }, [updateConfig]);

  const handleDurationChange = useCallback((value) => {
    changeRule("duration", value, updateConfig);
  }, [updateConfig]);

  const handleStageChange = useCallback((value) => {
    changeRule("stage", value, updateConfig);
  }, [updateConfig]);
  
  return (
    <PanelTemplate
      themeClasses={themeClasses}
      needToBlock={isStartedSending}
      exceptionElement={
        activeModal ? null : 
        <>
          <ButtonFooter
            zIndex={isStartedSending ? "z-[100]" : "z-40"}
          >
            <NotificationButton
              isStartedSending={isStartedSending}
              debugMode={debugMode}
              theme={theme}
              locale={locale}
              activeDeliveryMethod={activeDeliveryMethod}
              isReadyToStart={isReadyToStart}
              isProcessing={isProcessing}
              handleStartedSendingToggle={handleStartedSendingToggle}
              getButtonStyle={getButtonStyle}
            />
          </ButtonFooter>
          <NotificationMonitorModal
            isOpen={report.isOpen}
            isStartedSending={isStartedSending}
            onClose={() => setValidationAlert({ isOpen: false })}
            locale={locale.MonitoringSystem}
            themeClasses={themeClasses}
            layer={40}
          />
        </>
      }
    >
      <div className="grid grid-cols-9 gap-8 items-start flex-1">
        {/* Left part */}
        <div className="lg:col-span-3 space-y-4">
            <ToggleSwitch
                label={locale.DebugModeSwitchLabel}
                icon={Bug}
                checked={debugMode}
                color="amber"
                themeClasses={themeClasses}
                onChange={handleDebugModeChange}
            />
            <div className="flex-1 space-y-1">
                <Field
                  label={locale.UrlToTournamentLabel+"*"}
                  witdh="320"
                  icon={Globe}
                  value={urlToTournament}
                  onChange={handleTournamentUrlChange}
                  themeClasses={themeClasses}
                />
              </div>
              <div className="space-y-1">
                <Field
                  variant="select"
                  label={locale.GenreOrGameLabel+"*"}
                  icon={Search}
                  value={gameName}
                  onChange={(value) =>
                    updateConfig("tools", {
                      notificationSystem: {
                        game: { name: value },
                      },
                    })
                  }
                  items={listGames}
                  themeClasses={themeClasses}
                />
              </div>
            <div className={`p-6 rounded-[2.5rem] border space-y-6 ${themeClasses.section}`}>
              <div className={`flex items-center gap-2 border-b pb-3 ${themeClasses.divider}`}>
                <ImagePlus size={16} className="text-blue-500" />
                <span className={`text-[10px] font-black uppercase italic ${themeClasses.label}`}>
                  {locale.ConfigurationLogo.Label}
                </span>
              </div>
              <div className="flex gap-4 items-start">
                <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0  ${themeClasses.divider}`}>
                  {previewLogo ? (
                    <img
                      src={previewLogo}
                      className="w-full h-full object-cover"
                      alt="Logo"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-slate-500/20" />
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <Field
                      label={locale.ConfigurationLogo.UrlImageLabel}
                      icon={Globe}
                      value={urlLogoTournament}
                      onChange={(value) =>
                        updateConfig("tools", {
                          notificationSystem: {
                            logo: { img: value },
                          },
                        })
                      }
                      themeClasses={themeClasses}
                    />
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Central and right panels */}
        <div className="lg:col-span-6 space-y-4">
          <div
            className={`p-6 rounded-[2.5rem] border space-y-6 ${themeClasses.section}`}
          >
            <div
              className={`flex items-center justify-between border-b pb-3 ${themeClasses.divider}`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("rules")}
                  className={`flex items-center gap-2  ${activeTab === "rules" ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"}`}
                >
                  <FileSignature size={16} className="text-blue-500" />
                  <span
                    className={`text-[10px] font-black uppercase italic ${themeClasses.label}`}
                  >
                    {locale.RulesOfTournament.Label}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("lobby")}
                  className={`flex items-center gap-2  ${activeTab === "lobby" ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"}`}
                >
                  <Monitor size={16} className="text-blue-500" />
                  <span
                    className={`text-[10px] font-black uppercase italic ${themeClasses.label}`}
                  >
                    {locale.LobbyLiveBroadcast.Label}
                  </span>
                </button>
              </div>
            </div>

            {/* Content tabs */}
            <div className="flex-1">
              {activeTab === "rules" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    <Field
                      label={`${locale.RulesOfTournament.StandardFormat} (1-5)`}
                      variant="select"
                      value={rules.standardFormat}
                      icon={Settings2}
                      themeClasses={themeClasses}
                      onChange={handleStandardFormatChange}
                      items={listFT}
                    />
                    <Field
                      label={`${locale.RulesOfTournament.FinalFormat} (1-5)`}
                      variant="select"
                      value={rules.finalsFormat}
                      themeClasses={themeClasses}
                      icon={Trophy}
                      onChange={handleFinalsFormatChange}
                      items={listFT}
                    />
                    <Field
                      label={`${locale.RulesOfTournament.Rounds} (1-5)`}
                      value={rules.rounds}
                      icon={Trophy}
                      themeClasses={themeClasses}
                      isNumber={true}
                      onChange={handleRoundsChange}
                    />
                    <Field
                      label={locale.RulesOfTournament.Time}
                      variant="select"
                      value={rules.duration}
                      themeClasses={themeClasses}
                      icon={Timer}
                      items={durationItems}
                      onChange={handleDurationChange}
                    />
                    <Field
                      label={locale.RulesOfTournament.Stage}
                      variant="combobox"
                      value={stage}
                      themeClasses={themeClasses}
                      icon={Map}
                      items={[
                        {
                          label: locale.RulesOfTournament.ListStages.Any,
                          value: "Any",
                        },
                        {
                          label: locale.RulesOfTournament.ListStages.Random,
                          value: "Random",
                        },
                        {
                          label: locale.RulesOfTournament.ListStages.Selected,
                          value: "Selected",
                        },
                        {
                          label: locale.RulesOfTournament.ListStages.Repeat,
                          value: "Repeat",
                        },
                      ]}
                      onChange={handleStageChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Field
                        variant="select"
                        label={locale.LobbyLiveBroadcast.RegionLabel}
                        icon={Globe}
                        themeClasses={themeClasses}
                        value={streamLobby.area}
                        onChange={(value) =>
                          updateConfig("tools", {
                            notificationSystem: {
                              stream: { area: value },
                            },
                          })
                        }
                        items={[
                          {
                            label: locale.LobbyLiveBroadcast.ListRegions.Any,
                            value: "Any",
                          },
                          {
                            label: locale.LobbyLiveBroadcast.ListRegions.Europe,
                            value: "Europe",
                          },
                          {
                            label: locale.LobbyLiveBroadcast.ListRegions.Asia,
                            value: "Asia",
                          },
                          {
                            label: locale.LobbyLiveBroadcast.ListRegions.NorthAmerica,
                            value: "North America",
                          },
                          {
                            label: locale.LobbyLiveBroadcast.ListRegions.SouthAmerica,
                            value: "South America",
                          },
                          {
                            label: locale.LobbyLiveBroadcast.ListRegions.Africa,
                            value: "Africa",
                          },
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Field
                        variant="select"
                        icon={Zap}
                        label={locale.LobbyLiveBroadcast.TypeConnection.Label}
                        themeClasses={themeClasses}
                        value={streamLobby.conn}
                        onChange={(value) =>
                          updateConfig("tools", {
                            notificationSystem: {
                              stream: { conn: value },
                            },
                          })
                        }
                        items={[
                          {
                            label: locale.LobbyLiveBroadcast.TypeConnection.Any,
                            value: "Any",
                          },
                          {
                            label: locale.LobbyLiveBroadcast.TypeConnection.Lan,
                            value: "LAN",
                          },
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                        <Field
                          variant="select"
                          icon={Cpu}
                          label={locale.LobbyLiveBroadcast.CrossplatformLabel}
                          themeClasses={themeClasses}
                          value={streamLobby.crossplatform}
                          onChange={(value) => {
                            const boolValue = value === "true";
                            updateConfig("tools", {
                              notificationSystem: {
                                stream: {
                                  crossplatform: boolValue,
                                },
                              },
                            });
                          }}
                          items={[
                          {
                            label: locale.LobbyLiveBroadcast.ListCrossplatform.Yes,
                            value: "true",
                          },
                          {
                            label: locale.LobbyLiveBroadcast.ListCrossplatform.No,
                            value: "false",
                          },
                        ]}
                        />
                    </div>
                    <div className="space-y-1">
                      <Field
                        icon={Key}
                        label={locale.LobbyLiveBroadcast.AccessCodeLabel}
                        themeClasses={themeClasses}
                        value={passcode}
                        onChange={(value) =>
                          updateConfig("tools", {
                            notificationSystem: {
                              stream: { passcode: value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <Field
                      icon={Globe}
                      label={locale.LobbyLiveBroadcast.LinkToLobbyLabel}
                      themeClasses={themeClasses}
                      value={linkToLobby}
                      onChange={(value) =>
                        updateConfig("tools", {
                          notificationSystem: {
                            stream: { linkToLobby: value },
                          },
                        })
                      }
                    />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ValidationModal
        isOpen={validationAlert.isOpen}
        onClose={() => setValidationAlert({ isOpen: false, message: "" })}
        message={validationAlert.message}
        theme={theme}
        locale={localeValidation}
        themeClasses={themeClasses}
      />
    </PanelTemplate>
  );
};

export default NotificationSystemPlate;
