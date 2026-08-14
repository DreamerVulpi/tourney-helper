import React, { useCallback, useState } from "react";
import {
  Bug,
  Square,
  Play,
  Upload,
  Plus,
  Search,
  FileSignature,
  UserCheck,
  Image as ImageIcon,
  AlertCircle,
  Key,
  ImagePlus,
  Copy,
  Check,
  Settings2,
  Trophy,
  Timer,
  Clock,
  Monitor,
  Languages,
  Zap,
  Cpu,
  Globe,
  TextAlignStart,
  Server,
  ScrollText,
  HardDriveDownload,
  Map,
} from "lucide-react";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { PlatformBtn } from "../components/ui/PlatformButton.jsx";
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

const NotificationSystemPlate = ({
  theme,
  statusNotificationSystem,
  authStatus,
  setAuthStatus,
  systemCfg,
  tourneyCfg,
  updateConfig,
  locale,
  themeClasses,
  localeValidation,
  isStartedSending,
  setIsStartedSending,
  lang,
  activePlatform,
  setActivePlatform,
  activeMessenger,
  setActiveMessenger,
  isProcessing,
  setIsProcessing,
  activeModal,
  report,
  setReport,
}) => {
  // Get data from configs
  const debugMode = systemCfg?.debug?.mode || false;
  const urlToTournament = tourneyCfg?.urlToTournament;
  const gameName = tourneyCfg?.game.name || "tekken";
  const stage = tourneyCfg?.rules.stage || "Random";
  const rules = tourneyCfg?.rules || {
    standardFormat: 2,
    finalsFormat: 3,
    rounds: 3,
    duration: 60,
    stage: stage,
  };
  const passcode = tourneyCfg?.stream.passcode || "0000";
  const streamLobby = tourneyCfg?.stream || {
    area: "Any",
    language: "Any",
    connection: "Any",
    crossplatform: true,
    passcode: passcode,
  };
  const urlLogoTournament = tourneyCfg?.logo?.img || ""
  const previewLogo = urlLogoTournament || "https://raw.githubusercontent.com/DreamerVulpi/tourney-helper/main/branding/icons/256.png"

  // Field was edited
  const invalidateAuth = () => {
    setAuthStatus((prev) => ({
      ...prev,
      [activeSettings]: false,
    }));
  };

  // Get locale for label params bot
  const localeLabelParamsBot = locale.Platform.ParamsBot.split("%v");
  // State for settings button
  const [activeSettings, setActiveSettings] = useState(null); // 'startgg', 'discord' ...
  // Field of ID roles
  const roles = systemCfg?.[activeSettings]?.roles || { ru: "", en: "" };
  // State for ready of notification system
  const isReadyToStart =
    activePlatform &&
    authStatus?.[activePlatform] &&
    activeMessenger &&
    authStatus?.[activeMessenger] &&
    urlToTournament && gameName;
  // State for selected tab: Tournament Rules || Live Broadcast Lobby
  const [activeTab, setActiveTab] = useState("rules"); // "rules" or "lobby"
  // State for revial validation alert
  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });
  
  // Settings icon button for platforms
  const toggleSettings = useCallback((id) => {
    setActiveSettings((prev) => (prev === id ? null : id));
  }, []);

  // Handler for start proccess - Sending notifications
  const handleStartedSendingToggle = useStartSendingToggle(
    isStartedSending,
    setIsStartedSending,
    isProcessing,
    setIsProcessing,
    setReport,
    { activeMessenger, activePlatform, systemCfg, tourneyCfg, lang },
  );

  const handleTournamentUrlChange = useCallback((value) => {
    updateConfig("tournament", {
      ...tourneyCfg,
      urlToTournament: value,
    });
  }, [tourneyCfg, updateConfig]);
  const handleDebugModeChange = useCallback((value) => {
    updateConfig("system", {
      debug: {
        ...systemCfg.debug,
        mode: value,
      },
    });
  }, [systemCfg.debug, updateConfig]);

  // Button style for handler which start proccess
  const getButtonStyle = getLaunchButtonStyle(isStartedSending, debugMode);
  // Handler for messenger auth button
  const { handleMessengerClick } = useMessengerAuth({
    systemCfg,
    locale,
    activeMessenger,
    setActiveMessenger,
    setAuthStatus,
    setValidationAlert,
  });
  const handleDiscordClick = useCallback(() => {
    handleMessengerClick("discord");
  }, [handleMessengerClick]);

  const handleDiscordSettingsClick = useCallback(() => {
    toggleSettings("discord");
  }, []);

  // Handler for tournament platform auth button
  const { handleTournamentPlatformClick } =
  useTournamentPlatform({
    tourneyCfg,
    locale,
    activePlatform,
    setActivePlatform,
    setAuthStatus,
    setValidationAlert,
  });
  const handleStartggClick = useCallback(() => {
    handleTournamentPlatformClick("startgg");
  }, [handleTournamentPlatformClick]);

  const handleStartggSettingsClick = useCallback(() => {
    toggleSettings("startgg");
  }, []);

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


  // const rightPanelFooter = (
  //   <div className="flex flex-col items-end gap-3">
  //     {!isStartedSending && debugMode && (
  //       <div
  //         className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-amber-500 slide-in-from-bottom-2 ${
  //           theme === "dark"
  //             ? "bg-amber-500/10 border-amber-500/20"
  //             : "bg-white border-amber-200 shadow-lg"
  //         }`}
  //       >
  //         <AlertCircle size={14} className="shrink-0" />
  //         <span className="text-[9px] font-bold uppercase italic tracking-tight leading-tight">
  //           {locale.Mailing.AttentionDebugModeMsg}{" "}
  //           {activeMessenger ? activeMessenger : ""}
  //         </span>
  //       </div>
  //     )}

  //     {/* Start/stop sending messages */}
  //     <button
  //       type="button"
  //       disabled={!isReadyToStart || isProcessing}
  //       onClick={handleStartedSendingToggle}
  //       className={`
  //         relative
  //         flex
  //         items-center
  //         overflow-hidden
  //         h-14
  //         ${isStartedSending && !isProcessing
  //           ? "w-14 justify-center px-0 gap-0 hover:w-52" 
  //           : "px-10 gap-4"
  //         }
  //         rounded-2xl
  //         font-black text-lg uppercase tracking-wider italic
  //          duration-300
  //         overflow-hidden
  //         shadow-xl
  //         group
  //         text-white
  //         ${getButtonStyle}
  //         ${
  //           !isReadyToStart || isProcessing
  //             ? "opacity-40 cursor-not-allowed grayscale"
  //             : "hover:scale-[1.02] active:scale-95"
  //         }
  //       `}
  //     >
  //       {isProcessing ? (
  //         <>
  //           {/* Loading process */}
  //           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
  //           {isStartedSending ? locale.Mailing.Stop : locale.Mailing.Start}
  //         </>
  //       ) : isStartedSending ? (
  //         <>
  //           <div
  //             className="
  //               flex
  //               items-center
  //               justify-center
  //               w-5
  //               shrink-0
  //             "
  //           >
  //             <Square fill="white" size={20} className="shrink-0" />
  //           </div>

  //           <span
  //             className="
  //               flex
  //               items-center
  //               max-w-0
  //               overflow-hidden
  //               whitespace-nowrap
  //               opacity-0
  //               
  //               duration-300
  //               group-hover:max-w-[200px]
  //               group-hover:opacity-100
  //               group-hover:ml-3
  //             "
  //           >
  //             {locale.Mailing.Stop}
  //           </span>
  //         </>
  //       ) : (
  //         <>
  //           {debugMode ? (
  //             <Bug fill="white" size={20} />
  //           ) : (
  //             <Play fill="white" size={20} />
  //           )}
  //           {debugMode ? locale.Mailing.Debug : locale.Mailing.Start}
  //         </>
  //       )}
  //     </button>
  //   </div>
  // );

  return (
    <PanelTemplate
      themeClasses={themeClasses}
      needToBlock={isStartedSending}
      exceptionElement={
        activeModal ? null : 
        <>
          <div className="absolute bottom-8 right-8 z-100">
            <ButtonFooter
              isStartedSending={isStartedSending}
              debugMode={debugMode}
              theme={theme}
              locale={locale}
              activeMessenger={activeMessenger}
              isReadyToStart={isReadyToStart}
              isProcessing={isProcessing}
              handleStartedSendingToggle={handleStartedSendingToggle}
              getButtonStyle={getButtonStyle}
            />
          </div>
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
      <div className="grid grid-cols-12 gap-8 items-start flex-1">
        {/* Left part */}
        <div className="lg:col-span-4 space-y-4">
          <section className="h-[3rem]">
            <ToggleSwitch
                label={locale.DebugModeSwitchLabel}
                icon={Bug}
                checked={systemCfg.debug.mode}
                color="amber"
                themeClasses={themeClasses}
                onChange={handleDebugModeChange}
            />
          </section>

          {/* Platform buttons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-blue-500 italic px-1">
                {locale.Platform.Tourney}
              </span>
              <PlatformBtn
                label="Start.gg"
                active={activePlatform === "startgg"}
                auth={authStatus?.startgg}
                onClick={handleStartggClick}
                onSettingsClick={handleStartggSettingsClick}
                themeClasses={themeClasses}
                locale={locale.Platform.AuthorizeStatePlatform}
              />
              {/* In future updates */}
              {/* <PlatformBtn
                    label="Challonge"
                    active={activePlatform === "challonge"}
                    auth={authStatus?.challonge}
                    onClick={() => handleTournamentPlatformClick("challonge")}
                    onSettingsClick={() => toggleSettings("challonge")}
                    themeClasses={themeClasses}
                    locale={locale.Platform.AuthorizeStatePlatform}
                  /> */}
            </div>
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-blue-500 italic px-1">
                {locale.Platform.Messenger}
              </span>
              <PlatformBtn
                label="Discord"
                active={activeMessenger === "discord"}
                auth={authStatus?.discord}
                onClick={handleDiscordClick}
                onSettingsClick={handleDiscordSettingsClick}
                themeClasses={themeClasses}
                locale={locale.Platform.AuthorizeStatePlatform}
              />
              {/* In future updates */}
              {/* <PlatformBtn
                    label="Telegram"
                    active={activeMessenger === "telegram"}
                    auth={authStatus?.telegram}
                    onClick={() => handleMessengerClick("telegram")
                    }
                    onSettingsClick={() => toggleSettings("telegram")}
                    themeClasses={themeClasses}
                    locale={locale.Platform.AuthorizeStatePlatform}
                  /> */}
            </div>
          </div>

          {(activeSettings === "startgg" || activeSettings === "challonge") && (
            <section
              className={`p-4 rounded-2xl border space-y-3 ${themeClasses.tempSection}`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-current/5">
                <h4 className="text-[0.625rem] font-black uppercase text-amber-500 italic">
                  {locale.Platform.DownloadSettings} - {activeSettings}
                </h4>
                <button
                  onClick={() => setActiveSettings(null)}
                  className="text-slate-500 hover:text-amber-500"
                >
                  <Plus className="rotate-45" size={14} />
                </button>
              </div>

              <Field
                  label={locale.Platform.RedirectURL}
                  variant="copy"
                  value={"http://127.0.0.1:7310/startgg/callback"}
                  icon={HardDriveDownload}
                  themeClasses={themeClasses}
              />
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Field
                  label={"CLIENT ID*"}
                  icon={TextAlignStart}
                  value={tourneyCfg[activeSettings]?.clientID || ""}
                  onChange={(value) => {
                      invalidateAuth();
                      updateConfig("tournament", {
                        ...tourneyCfg,
                        [activeSettings]: {
                          ...tourneyCfg[activeSettings],
                          clientID: value,
                        },
                      });
                  }}
                  themeClasses={themeClasses}
                />

                <Field
                  label={"SECRET CLIENT*"}
                  variant="password"
                  icon={Key}
                  isSecret
                  value={tourneyCfg[activeSettings]?.secretClient || ""}
                  themeClasses={themeClasses}
                  onChange={(value) => {
                      invalidateAuth();
                      updateConfig("tournament", {
                        ...tourneyCfg,
                        [activeSettings]: {
                          ...tourneyCfg[activeSettings],
                          secretClient: value,
                        },
                      });
                    }}
                />
              </div>
            </section>
          )}

          {(activeSettings === "discord" || activeSettings == "telegram") && (
            <section
              className={`p-4 rounded-2xl border space-y-3 duration-300 max-h-[40vh] custom-scrollbar overflow-y-auto ${themeClasses.tempSection}`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-current/5">
                <h4 className="text-[9px] font-black uppercase text-blue-500 italic">
                  {localeLabelParamsBot[0]} {localeLabelParamsBot[1]} - {activeSettings} 
                </h4>
                <button
                  onClick={() => setActiveSettings(null)}
                  className="text-slate-500 hover:text-blue-500"
                >
                  <Plus className="rotate-45" size={14} />
                </button>
              </div>

              {activeSettings === "discord" && (
                <div className="space-y-1">
                  <Field
                    label={locale.Platform.RedirectURL}
                    variant="copy"
                    value={"http://127.0.0.1:7310/discord/callback"}
                    icon={HardDriveDownload}
                    themeClasses={themeClasses}
                  />
                </div>
              )}

              <div className="space-y-1">
                <Field
                  label={locale.Platform.TokenBot+"*"}
                  icon={Key}
                  variant="password"
                  value={systemCfg[activeSettings]?.token}
                  themeClasses={themeClasses}
                  onChange={(value) => {
                      invalidateAuth();
                      updateConfig("system", {
                        ...systemCfg,
                        [activeSettings]: {
                          ...systemCfg[activeSettings],
                          token: value,
                        },
                      });
                    }}
                />
              </div>

              {(activeSettings === "discord" ||
                activeSettings === "telegram") && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <Field
                        label={"GUILD ID*"}
                        icon={Server}
                        value={systemCfg?.[activeSettings]?.guildID}
                        onChange={(value) => {
                          invalidateAuth();
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              guildID: value,
                            },
                          });
                        }}
                        themeClasses={themeClasses}
                      />
                    </div>
                    <div className="space-y-1">
                      <Field
                        label={"LOG CHANNEL ID"}
                        icon={ScrollText}
                        value={systemCfg?.[activeSettings]?.debugChannelID}
                        themeClasses={themeClasses}
                        onChange={(value) => {
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              debugChannelID: value,
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Field
                        label={"CLIENT ID*"}
                        value={systemCfg?.[activeSettings]?.clientID}
                        icon={TextAlignStart}
                        onChange={(value) => {
                          invalidateAuth();
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              clientID: value,
                            },
                          });
                        }}
                        themeClasses={themeClasses}
                      />
                    </div>
                    <div className="space-y-1">
                      <Field
                      label={"ROLE ID - EN"}
                      icon={Languages}
                      themeClasses={themeClasses}
                      value={roles.en || ""}
                        onChange={(value) =>
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              roles: {
                                ...systemCfg[activeSettings]?.roles,
                                en: value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                       <Field
                        label={"SECRET CLIENT*"}
                        icon={Key}
                        variant={"password"}
                        themeClasses={themeClasses}
                        value={systemCfg?.[activeSettings]?.secretClient}
                        onChange={(value) => {
                          invalidateAuth();
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              secretClient: value,
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Field
                      label={"ROLE ID - RU"}
                      icon={Languages}
                      themeClasses={themeClasses}
                      value={roles.ru || ""}
                        onChange={(value) =>
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              roles: {
                                ...systemCfg[activeSettings]?.roles,
                                ru: value,
                              },
                            },
                          })
                        }
                    />
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        {/* Central and right panels */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-10 gap-8">
          <div className="col-span-12 lg:col-span-6 space-y-6">
            <section className="flex gap-4 h-[48px] items-end">
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
              <div className="w-[180px] space-y-1">
                <Field
                  variant="select"
                  label={locale.GenreOrGameLabel+"*"}
                  icon={Search}
                  value={gameName}
                  onChange={(value) =>
                    updateConfig("tournament", {
                      game: {
                        ...tourneyCfg.game,
                        name: value,
                      },
                    })
                  }
                  items={listGames}
                  themeClasses={themeClasses}
                />
              </div>
            </section>

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
                            updateConfig("tournament", {
                              stream: {
                                ...streamLobby,
                                area: value,
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
                          value={streamLobby.connection}
                          onChange={(value) =>
                            updateConfig("tournament", {
                              stream: {
                                ...streamLobby,
                                connection: value,
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
                              updateConfig("tournament", {
                                stream: {
                                  ...streamLobby,
                                  crossplatform: boolValue,
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
                            updateConfig("tournament", {
                              stream: {
                                ...streamLobby,
                                passcode: value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div
              className={`p-6 rounded-[2.5rem] border space-y-6 ${themeClasses.section}`}
            >
              <div
                className={`flex items-center gap-2 border-b pb-3 ${themeClasses.divider}`}
              >
                <ImagePlus size={16} className="text-blue-500" />
                <span
                  className={`text-[10px] font-black uppercase italic ${themeClasses.label}`}
                >
                  {locale.ConfigurationLogo.Label}
                </span>
              </div>
              <div className="flex gap-4 items-start">
                <div
                  className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0  ${themeClasses.divider}`}
                >
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
                          updateConfig("tournament", {
                            ...tourneyCfg,
                            logo: { img: value },
                          })
                        }
                      themeClasses={themeClasses}
                    />
                  </div>
                </div>
              </div>
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
