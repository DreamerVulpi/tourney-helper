import React, { useState } from "react";
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
import {
  AuthorizeDiscord,
  AuthorizeStartgg,
  StartSendNotifications,
  StopSendNotifications,
} from "../../wailsjs/go/application/App.js";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { PlatformBtn } from "../components/ui/PlatformButton.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";
import { changeRule } from "../utils/NotificationSystemPanel.jsx/changeRule.jsx";
import { useStartSendingToggle } from "../hooks/NotificationSystemPanel/useStartSendingToggle.jsx";
import { Field } from "../components/ui/Field.jsx";
import { ToggleSwitch } from "../components/ui/ToggleSwitch.jsx";
import { ValidationModal } from "../components/ValidationModal.jsx";
import { useMessengerAuth } from "../hooks/useMessengerAuth.jsx";
import { useTournamentPlatform } from "../hooks/useTournamentPlatform.jsx";

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
}) => {
  // Get data from configs
  const debugMode = systemCfg?.debug?.mode || false;
  const urlToTournament = tourneyCfg?.urlToTournament || "-";
  const rules = tourneyCfg?.rules || {
    standardFormat: 2,
    finalsFormat: 3,
    rounds: 3,
    duration: 60,
    stage: "Random",
  };
  const streamLobby = tourneyCfg?.stream || {
    area: "Any",
    language: "Any",
    connection: "Any",
    crossplatform: true,
    passcode: "0000",
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
    authStatus?.[activeMessenger];
  // State for selected tab: Tournament Rules || Live Broadcast Lobby
  const [activeTab, setActiveTab] = useState("rules"); // "rules" or "lobby"
  // State for revial validation alert
  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });

  // Settings icon button for platforms
  const toggleSettings = (id) => {
    // open/close settings when click on icon
    setActiveSettings(activeSettings === id ? null : id);
  };

  // Array for 2 fields
  const listFT = [
    {
      label: "FT1",
      value: 1,
    },
    {
      label: "FT2",
      value: 2,
    },
    {
      label: "FT3",
      value: 3,
    },
    {
      label: "FT4",
      value: 4,
    },
    {
      label: "FT5",
      value: 5,
    },
  ]

  // Handler for start proccess - Sending notifications
  const handleStartedSendingToggle = useStartSendingToggle(
    isStartedSending,
    setIsStartedSending,
    isProcessing,
    setIsProcessing,
    { activeMessenger, activePlatform, systemCfg, tourneyCfg, lang },
  );
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

  const rightPanelFooter = (
    <div className="flex flex-col items-end gap-3">
      {!isStartedSending && debugMode && (
        <div
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-amber-500 slide-in-from-bottom-2 ${
            theme === "dark"
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-white border-amber-200 shadow-lg"
          }`}
        >
          <AlertCircle size={14} className="shrink-0" />
          <span className="text-[9px] font-bold uppercase italic tracking-tight leading-tight">
            {locale.Mailing.AttentionDebugModeMsg}{" "}
            {activeMessenger ? activeMessenger : ""}
          </span>
        </div>
      )}

      {/* Start/stop sending messages */}
      <button
        type="button"
        disabled={!isReadyToStart || isProcessing}
        onClick={handleStartedSendingToggle}
        className={`flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-lg uppercase tracking-wider italic transition-all shadow-xl group text-white ${getButtonStyle} ${
          !isReadyToStart || isProcessing
            ? "opacity-40 cursor-not-allowed grayscale"
            : "hover:scale-[1.02] active:scale-95"
        }`}
      >
        {isProcessing ? (
          <>
            {/* Loading process */}
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isStartedSending ? locale.Mailing.Stop : locale.Mailing.Start}
          </>
        ) : isStartedSending ? (
          <>
            <Square fill="white" size={20} /> {locale.Mailing.Stop}
          </>
        ) : (
          <>
            {debugMode ? (
              <Bug fill="white" size={20} />
            ) : (
              <Play fill="white" size={20} />
            )}
            {debugMode ? locale.Mailing.Debug : locale.Mailing.Start}
          </>
        )}
      </button>
    </div>
  );

  return (
    <PanelTemplate
      themeClasses={themeClasses}
      needToBlock={isStartedSending}
      exceptionElement={
        activeModal ? null :rightPanelFooter
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
                onChange={(value) =>
                    updateConfig("system", {
                        debug: {
                            ...systemCfg.debug,
                            mode: value,
                        },
                    })
                }
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
                onClick={() => handleTournamentPlatformClick("startgg")}
                onSettingsClick={() => toggleSettings("startgg")}
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
                onClick={() => handleMessengerClick("discord")}
                onSettingsClick={() => toggleSettings("discord")}
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
                  label={"CLIENT ID"}
                  icon={TextAlignStart}
                  value={tourneyCfg[activeSettings]?.clientID || ""}
                  onChange={(value) => {
                      setAuthStatus((prev) => ({
                        ...prev,
                        [activeSettings]: false,
                      }));
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
                  label={"SECRET CLIENT"}
                  variant="password"
                  icon={Key}
                  isSecret
                  value={tourneyCfg[activeSettings]?.secretClient || ""}
                  themeClasses={themeClasses}
                  onChange={(value) => {
                      setAuthStatus((prev) => ({
                        ...prev,
                        [activeSettings]: false,
                      }));
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
              className={`p-4 rounded-2xl border space-y-3 animate-in zoom-in-95 duration-300 max-h-[40vh] custom-scrollbar overflow-y-auto ${themeClasses.tempSection}`}
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
                  label={locale.Platform.TokenBot}
                  icon={Key}
                  variant="password"
                  value={systemCfg[activeSettings]?.token}
                  themeClasses={themeClasses}
                  onChange={(value) => {
                      setAuthStatus((prev) => ({
                        ...prev,
                        [activeSettings]: false,
                      }));
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
                        label={"GUILD ID"}
                        icon={Server}
                        value={systemCfg?.[activeSettings]?.guildID}
                        onChange={(value) => {
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
                        label={"CLIENT ID"}
                        value={systemCfg?.[activeSettings]?.clientID}
                        icon={TextAlignStart}
                        onChange={(value) => {
                          setAuthStatus((prev) => ({
                            ...prev,
                            [activeSettings]: false,
                          }));
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
                        label={"SECRET CLIENT"}
                        icon={Key}
                        variant={"password"}
                        themeClasses={themeClasses}
                        value={systemCfg?.[activeSettings]?.secretClient}
                        onChange={(value) => {
                          setAuthStatus((prev) => ({
                            ...prev,
                            [activeSettings]: false,
                          }));
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
                  label={locale.UrlToTournamentLabel}
                  witdh="320"
                  icon={Globe}
                  value={urlToTournament}
                  onChange={(value) =>
                    updateConfig("tournament", {
                      ...tourneyCfg,
                      urlToTournament: value,
                    })
                  }
                  themeClasses={themeClasses}
                />
              </div>
              <div className="w-[180px] space-y-1">
                <Field
                  variant="select"
                  label={locale.GenreOrGameLabel}
                  icon={Search}
                  value={tourneyCfg.game.name}
                  onChange={(value) =>
                    updateConfig("tournament", {
                      game: {
                        ...tourneyCfg.game,
                        name: value,
                      },
                    })
                  }
                  items={[
                    {
                      label: "Tekken 8",
                      value: "tekken",
                    },
                    {
                      label: "Street Fighter 6",
                      value: "sf6",
                    },
                  ]}
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
                    className={`flex items-center gap-2 transition-all ${activeTab === "rules" ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"}`}
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
                    className={`flex items-center gap-2 transition-all ${activeTab === "lobby" ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"}`}
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
                        onChange={(val) =>
                          changeRule("standardFormat", val, updateConfig)
                        }
                        items={listFT}
                      />
                      <Field
                        label={`${locale.RulesOfTournament.FinalFormat} (1-5)`}
                        variant="select"
                        value={rules.finalsFormat}
                        themeClasses={themeClasses}
                        icon={Trophy}
                        onChange={(val) =>
                          changeRule("finalsFormat", val, updateConfig)
                        }
                        items={listFT}
                      />
                      <Field
                        label={`${locale.RulesOfTournament.Rounds} (1-5)`}
                        value={rules.rounds}
                        icon={Trophy}
                        themeClasses={themeClasses}
                        isNumber={true}
                        onChange={(val) => {
                          const rounds = Math.min(5, Math.max(1, Number(val) || 1));
                          changeRule("rounds", rounds, updateConfig);
                        }}
                      />
                      <Field
                        label={locale.RulesOfTournament.Time}
                        variant="select"
                        value={rules.duration}
                        themeClasses={themeClasses}
                        icon={Timer}
                        items={[
                          {
                            label: "30",
                            value: 30,
                          },
                          {
                            label: "45",
                            value: 45,
                          },
                          {
                            label: "60",
                            value: 60,
                          },
                          {
                            label: "99",
                            value: 99,
                          },
                        ]}
                        onChange={(val) =>
                          changeRule("duration", val, updateConfig)
                        }
                      />
                      <Field
                        label={locale.RulesOfTournament.Stage}
                        variant="combobox"
                        value={rules.stage}
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
                        onChange={(val) =>
                          changeRule("stage", val, updateConfig)
                        }
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
                          value={streamLobby.passcode}
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
                  className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-all ${themeClasses.divider}`}
                >
                  {tourneyCfg?.logo?.img ? (
                    <img
                      src={tourneyCfg?.logo?.img}
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
                      value={tourneyCfg?.logo?.img}
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
