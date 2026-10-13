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
import { durationItems, listFT } from "../utils/NotificationSystemPanel.jsx/lists.js";
import { listGames } from "../utils/listGames.js";
import { ButtonFooter } from "../components/ui/ButtonFooter.jsx";
import { NotificationButton } from "../hooks/NotificationSystemPanel/useButtonFooter.jsx";
import { useThemeClasses } from "../hooks/App/useThemeClasses"
import { getThemeClasses } from "../utils/themeClasses";
import { useAppStore } from "../store/useAppStore";
import { TabbedSection } from "../components/ui/tabbedSection.jsx";
import { useClientFromRef } from "../hooks/App/useClientFromRef.jsx"

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
  const selections = useAppStore((s) => s.integrationsSelections);

  // Ключ совпадает с activeTab в сторе → "notifications"
  const tourneyRef  = selections?.notifications?.tourney?.[0]  ?? null;
  const deliveryRef = selections?.notifications?.delivery?.[0] ?? null;

  // Future: Add support more 1 delivery method
  const tourneyClient  = useClientFromRef(tourneyRef);
  const deliveryClient = useClientFromRef(deliveryRef);
 
  const notificationSystem = useAppStore((s) => s.tools?.notificationSystem);
  const theme        = useAppStore((s) => s.theme);
  const authorizations    = useAppStore((s) => s.authorizations);
  const settings = useAppStore((s) => s.settings);
  const activeModal  = useAppStore((s) => s.activeModal);
  
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

  console.log("[NSP] selections.notificationSystem:", JSON.stringify(selections?.notificationSystem));
  console.log("[NSP] tourneyRef:", tourneyRef, "| deliveryRef:", deliveryRef);
  console.log("[NSP] tourneyClient:", tourneyClient);
  console.log("[NSP] deliveryClient:", deliveryClient);
  console.log("[NSP] authorizations:", authorizations);
  console.log("[NSP] urlToTournament:", urlToTournament, "| gameName:", gameName);
  console.log("[NSP] isReadyToStart:", {
    tourneyOk:  tourneyClient?.status  === "authorized",
    deliveryOk: deliveryClient?.status === "authorized",
    urlOk:      !!urlToTournament,
    gameOk:     !!gameName,
  });
  // State for ready of notification system
  const isReadyToStart =
    tourneyClient?.status  === "authorized" &&
    deliveryClient?.status === "authorized" &&
    !!urlToTournament &&
    !!gameName;
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
    {
      tourneyClient,
      deliveryClient,
      authorizations,
      notificationSystem,
      settings,
    },
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

  const TOOL_TABS = [
    { id: "rules", icon: FileSignature, label: locale.RulesOfTournament.Label },
    { id: "lobby", icon: Monitor,        label: locale.LobbyLiveBroadcast.Label },
    { id: "logo", icon: ImageIcon, label: locale.ConfigurationLogo.Label}
  ]
  console.log("[NSP] notificationSystem before toggle:", notificationSystem);

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
              deliveryLabel={
                deliveryClient
                  ? (`${deliveryClient.platform} #${deliveryClient.slotIndex + 1}`)
                  : ""
              }
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
        </div>

        {/* Central and right panels */}
        <div className="lg:col-span-5 space-y-4 ">
          <TabbedSection
            tabs={TOOL_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            themeClasses={themeClasses}
            className="flex-1 min-h-0"
          >
            {(tab) =>
              tab === "rules" ? (
                <div className="flex flex-col h-full min-h-0 space-y-4">
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
              ) : tab === "logo" ? (
                <div className="flex flex-col h-full min-h-0 space-y-4">
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
              ) : (
                <div className="flex flex-col h-full min-h-0 space-y-4">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
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
              )
            }
          </TabbedSection>
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
