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
  Globe,
  Languages,
  Zap,
  Cpu,
} from "lucide-react";
import {
  AuthorizeDiscord,
  AuthorizeStartgg,
  StartSendNotifications,
  StopSendNotifications,
} from "../../wailsjs/go/application/App.js";
import ValidationAlertModal from "../components/ValidationAlertModal.jsx";
import PanelTemplate from "../components/PanelTemplate.jsx";
import { RuleInput } from "../components/NotificationSystemPanel/RuleInput.jsx"
import { PlatformBtn } from "../components/ui/PlatformButton.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";


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
}) => {
  /////////////
  // Get data from configs
  const debugMode = systemCfg?.debug?.mode || false;
  const urlToTournament = tourneyCfg?.urlToTournament || "-";
  const rules = tourneyCfg?.rules || {
    standardFormat: 2,
    finalsFormat: 3,
    rounds: 3,
    duration: 60,
  };
  const streamLobby = tourneyCfg?.stream || {
    area: "Any",
    language: "Any",
    connection: "Any",
    crossplatform: true,
    passcode: "0000",
  };
  /////////////

  /////////////
  // Statements for UI
  const [activeSettings, setActiveSettings] = useState(null); // 'startgg', 'challonge', 'discord', 'telegram'
  const roles = systemCfg?.[activeSettings]?.roles || { ru: "", en: "" };
  const [copied, setCopied] = useState(false);
  const isReadyToStart =
    activePlatform &&
    authStatus?.[activePlatform] &&
    activeMessenger &&
    authStatus?.[activeMessenger];
  const [activeTab, setActiveTab] = useState("rules"); // "rules" or "lobby"
  const toggleSettings = (id) => {
    // open/close settings when click on gear
    setActiveSettings(activeSettings === id ? null : id);
  };
  const isDark = theme === "dark";
  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });
  /////////////

  /////////////
  // handlers for text fields
  const handleRuleChange = (field, newValue) => {
    updateConfig("tournament", {
      rules: { ...rules, [field]: newValue },
    });
  };

  const handleStartedSendingToggle = async (locale) => {
    if (isProcessing) return;

    setIsProcessing(true);

    if (isStartedSending) {
      try {
        await StopSendNotifications();
        setIsStartedSending(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      await StartSendNotifications(
        activeMessenger,
        activePlatform,
        systemCfg,
        tourneyCfg,
        lang,
      );
      setIsStartedSending(true);
    } catch (err) {
      console.error(err);
      setIsStartedSending(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonStyle = getLaunchButtonStyle(isStartedSending, debugMode);

  const handleCopy = () => {
    navigator.clipboard.writeText("http://127.0.0.1:7310/callback");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  /////////////

  const paramsBotParts = locale.Platform.ParamsBot.split("%v");
  const launchMsgParts = locale.Platform.LaunchMsg.split("%v");
  const successMsgParts = locale.Platform.SuccessMsg.split("%v");

  const handleMessengerClick = async (messengerName) => {
    const nextMessenger =
      activeMessenger === messengerName ? "" : messengerName;
    setActiveMessenger(nextMessenger);

    if (nextMessenger === "discord") {
      const token = systemCfg[nextMessenger]?.token;
      const clientID = systemCfg[nextMessenger]?.clientID;
      const secretClient = systemCfg[nextMessenger]?.secretClient;

      if (!token || !clientID || !secretClient) {
        setActiveMessenger("");
        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsg,
        });
        return;
      }

      try {
        await AuthorizeDiscord(clientID, secretClient);
        setAuthStatus((prev) => ({ ...prev, discord: true }));
      } catch (err) {
        console.error(err);
        setAuthStatus((prev) => ({ ...prev, discord: false }));
      }
    }
  };

  const handleTournamentPlatformClick = async (platformName) => {
    const nextPlatform = activePlatform === platformName ? "" : platformName;
    setActivePlatform(nextPlatform);

    if (nextPlatform === "startgg") {
      const clientID = tourneyCfg[nextPlatform]?.clientID;
      const secretClient = tourneyCfg[nextPlatform]?.secretClient;

      if (!clientID || !secretClient) {
        setActivePlatform("");
        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsg,
        });
        return;
      }

      try {
        await AuthorizeStartgg(clientID, secretClient);
        setAuthStatus((prev) => ({ ...prev, startgg: true }));
      } catch (err) {
        console.error(err);
        setAuthStatus((prev) => ({ ...prev, startgg: false }));
      }
    }
  };

  const rightPanelFooter = (
    <div className="flex flex-col items-end gap-3">
      {/* Текстовое предупреждение отладки (отображается только если рассылка НЕ запущена) */}
      {!isStartedSending && debugMode && (
        <div
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-amber-500 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            theme === "dark"
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-white border-amber-200 shadow-lg"
          }`}
        >
          <AlertCircle size={16} className="shrink-0" />
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
        onClick={() => handleStartedSendingToggle(locale)}
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
      exceptionElement={rightPanelFooter}
    >
      <div className="grid grid-cols-12 gap-8 items-start flex-1">
        {/* Left panel */}
        <div className="col-span-12 lg:col-span-4 space-y-2">
          <section className="h-[48px] items-center">
            <div
              className={`w-full flex items-center justify-between p-3 rounded-xl border ${isDark ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-200"}`}
            >
              <div className="flex items-center gap-3">
                <Bug size={18} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase italic leading-none">
                  {locale.DebugModeSwitchLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateConfig("system", {
                    ...systemCfg,
                    debug: {
                      ...systemCfg.debug,
                      mode: !systemCfg.debug.mode,
                    },
                  })
                }
                className={`w-10 h-5 rounded-full relative transition-all ${debugMode ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-slate-700"}`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${debugMode ? "right-0.5" : "left-0.5"}`}
                />
              </button>
            </div>
          </section>

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
              className={`p-4 rounded-2xl border space-y-3 animate-in zoom-in-95 duration-300 ${isDark ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-100"}`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-current/5">
                <h4 className="text-[9px] font-black uppercase text-amber-500 italic">
                  {locale.Platform.DownloadSettings} ({activeSettings})
                </h4>
                <button
                  onClick={() => setActiveSettings(null)}
                  className="text-slate-500 hover:text-amber-500"
                >
                  <Plus className="rotate-45" size={14} />
                </button>
              </div>

              <div className="space-y-1 pt-1 animate-in fade-in duration-300">
                  <label
                    className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                  >
                    {locale.Platform.RedirectURL}
                  </label>
                  <div
                    className={`flex items-center gap-2 p-1.5 rounded-lg border border-dashed ${isDark ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`}
                  >
                    <code className="flex-1 text-[10px] font-mono text-blue-500 truncate pl-1">
                      http://127.0.0.1:7310/callback
                    </code>
                    <button
                      onClick={handleCopy}
                      className={`p-1.5 rounded-md transition-all ${copied ? "bg-green-500/20 text-green-500" : "hover:bg-blue-500/10 text-slate-500 hover:text-blue-500"}`}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-1">
                  <label
                    className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                  >
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={tourneyCfg[activeSettings]?.clientID || ""}
                    onChange={(e) => {
                      setAuthStatus((prev) => ({
                        ...prev,
                        [activeSettings]: false,
                      }));
                      updateConfig("tournament", {
                        ...tourneyCfg,
                        [activeSettings]: {
                          ...tourneyCfg[activeSettings],
                          clientID: e.target.value,
                        },
                      });
                    }}
                    className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                    placeholder="ID приложения"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                  >
                    Secret Client
                  </label>
                  <input
                    type="password"
                    value={tourneyCfg[activeSettings]?.secretClient || ""}
                    onChange={(e) => {
                      setAuthStatus((prev) => ({
                        ...prev,
                        [activeSettings]: false,
                      }));
                      updateConfig("tournament", {
                        ...tourneyCfg,
                        [activeSettings]: {
                          ...tourneyCfg[activeSettings],
                          secretClient: e.target.value,
                        },
                      });
                    }}
                    className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </section>
          )}

          {(activeSettings === "discord" || activeSettings == "telegram") && (
            <section
              className={`p-4 rounded-2xl border space-y-3 animate-in zoom-in-95 duration-300 ${isDark ? "bg-blue-600/5 border-blue-600/10" : "bg-blue-50 border-blue-100"}`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-current/5">
                <h4 className="text-[9px] font-black uppercase text-blue-500 italic">
                  {paramsBotParts[0]} {activeSettings} {paramsBotParts[1]}
                </h4>
                <button
                  onClick={() => setActiveSettings(null)}
                  className="text-slate-500 hover:text-blue-500"
                >
                  <Plus className="rotate-45" size={14} />
                </button>
              </div>

              {activeSettings === "discord" && (
                <div className="space-y-1 pt-1 animate-in fade-in duration-300">
                  <label
                    className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                  >
                    {locale.Platform.RedirectURL}
                  </label>
                  <div
                    className={`flex items-center gap-2 p-1.5 rounded-lg border border-dashed ${isDark ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`}
                  >
                    <code className="flex-1 text-[10px] font-mono text-blue-500 truncate pl-1">
                      http://127.0.0.1:7310/callback
                    </code>
                    <button
                      onClick={handleCopy}
                      className={`p-1.5 rounded-md transition-all ${copied ? "bg-green-500/20 text-green-500" : "hover:bg-blue-500/10 text-slate-500 hover:text-blue-500"}`}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label
                  className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                >
                  {locale.Platform.TokenBot}
                </label>
                <div className="relative flex items-center">
                  <Key size={12} className="absolute left-2.5 text-slate-500" />
                  <input
                    type="password"
                    value={systemCfg[activeSettings]?.token}
                    onChange={(e) => {
                      setAuthStatus((prev) => ({
                        ...prev,
                        [activeSettings]: false,
                      }));
                      updateConfig("system", {
                        ...systemCfg,
                        [activeSettings]: {
                          ...systemCfg[activeSettings],
                          token: e.target.value,
                        },
                      });
                    }}
                    className={`w-full rounded-lg pl-8 pr-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                  />
                </div>
              </div>

              {(activeSettings === "discord" ||
                activeSettings === "telegram") && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-1">
                      <label
                        className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                      >
                        Guild ID
                      </label>
                      <input
                        type="text"
                        value={systemCfg?.[activeSettings]?.guildID}
                        onChange={(e) => {
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              guildID: e.target.value,
                            },
                          });
                        }}
                        className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                      >
                        Log Channel ID
                      </label>
                      <input
                        type="text"
                        value={systemCfg?.[activeSettings]?.debugChannelID}
                        onChange={(e) => {
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              debugChannelID: e.target.value,
                            },
                          });
                        }}
                        className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                      >
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={systemCfg?.[activeSettings]?.clientID}
                        onChange={(e) => {
                          setAuthStatus((prev) => ({
                            ...prev,
                            [activeSettings]: false,
                          }));
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              clientID: e.target.value,
                            },
                          });
                        }}
                        className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                      >
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={systemCfg?.[activeSettings]?.secretClient}
                        onChange={(e) => {
                          setAuthStatus((prev) => ({
                            ...prev,
                            [activeSettings]: false,
                          }));
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              secretClient: e.target.value,
                            },
                          });
                        }}
                        className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                      >
                        Role ID - RU
                      </label>
                      <input
                        type="text"
                        value={roles.ru || ""}
                        onChange={(e) =>
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              roles: {
                                ...systemCfg[activeSettings]?.roles,
                                ru: e.target.value,
                              },
                            },
                          })
                        }
                        className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                      >
                        Role ID - EN
                      </label>
                      <input
                        type="text"
                        value={roles.en || ""}
                        onChange={(e) =>
                          updateConfig("system", {
                            ...systemCfg,
                            [activeSettings]: {
                              ...systemCfg[activeSettings],
                              roles: {
                                ...systemCfg[activeSettings]?.roles,
                                en: e.target.value,
                              },
                            },
                          })
                        }
                        className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-mono border ${themeClasses.input}`}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        {/* Central and right panels */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-10 gap-6">
          <div className="col-span-12 lg:col-span-6 space-y-6">
            <section className="flex gap-4 h-[58px] items-end">
              <div className="flex-1 space-y-1">
                <label
                  className={`text-[9px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                >
                  {locale.UrlToTournamentLabel}
                </label>
                <input
                  type="text"
                  value={urlToTournament}
                  onChange={(e) =>
                    updateConfig("tournament", {
                      ...tourneyCfg,
                      urlToTournament: e.target.value,
                    })
                  }
                  className={`w-full rounded-xl px-4 py-2 text-xs font-bold border outline-none focus:border-blue-600 transition-all ${themeClasses.input}`}
                  placeholder="tekken-world-tour"
                />
              </div>
              <div className="w-[180px] space-y-1">
                <label
                  className={`text-[9px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                >
                  {locale.GenreOrGameLabel}
                </label>
                <div className="relative flex items-center">
                  <Search
                    size={14}
                    className="absolute left-3 text-slate-500 pointer-events-none z-10"
                  />
                  <select
                    value={tourneyCfg?.game?.name}
                    className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs font-bold border outline-none appearance-none transition-all ${themeClasses.input}`}
                    onChange={(e) =>
                      updateConfig("tournament", {
                        game: {
                          ...tourneyCfg.game,
                          name: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="tekken">Tekken 8</option>
                    <option value="sf6">Street Fighter 6</option>
                  </select>
                </div>
              </div>
            </section>

            <div
              className={`p-6 rounded-[2.5rem] border space-y-6 ${themeClasses.section}`}
            >
              <div
                className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-white/5" : "border-slate-100"}`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab("rules")}
                    className={`flex items-center gap-2 transition-all ${activeTab === "rules" ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"}`}
                  >
                    <FileSignature size={16} className="text-blue-500" />
                    <span
                      className={`text-[10px] font-black uppercase italic ${themeClasses.textMuted}`}
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
                      className={`text-[10px] font-black uppercase italic ${themeClasses.textMuted}`}
                    >
                      {locale.LobbyLiveBroadcast.Label}
                    </span>
                  </button>
                </div>
              </div>

              {/* Content tabs */}
              <div className="flex-1">
                {activeTab === "rules" ? (
                  <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <RuleInput
                        label={locale.RulesOfTournament.StandardFormat}
                        type="select"
                        value={rules.standardFormat}
                        min={1}
                        max={5}
                        prefix="FT"
                        icon={Settings2}
                        themeClasses={themeClasses}
                        onChange={(val) =>
                          handleRuleChange("standardFormat", val)
                        }
                      />
                      <RuleInput
                        label={locale.RulesOfTournament.FinalFormat}
                        type="select"
                        value={rules.finalsFormat}
                        min={1}
                        max={5}
                        prefix="FT"
                        icon={Trophy}
                        themeClasses={themeClasses}
                        onChange={(val) =>
                          handleRuleChange("finalsFormat", val)
                        }
                      />
                      <RuleInput
                        label={locale.RulesOfTournament.Rounds}
                        value={rules.rounds}
                        min={1}
                        max={5}
                        icon={Trophy}
                        themeClasses={themeClasses}
                        onChange={(val) => handleRuleChange("rounds", val)}
                      />
                      <RuleInput
                        label={locale.RulesOfTournament.Time}
                        value={rules.duration}
                        min={30}
                        max={99}
                        suffix={locale.RulesOfTournament.Seconds}
                        icon={Timer}
                        themeClasses={themeClasses}
                        onChange={(val) => handleRuleChange("duration", val)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* 1. Region */}
                      <div className="space-y-1.5">
                        <label
                          className={`text-[9px] font-black uppercase flex items-center gap-2 ${themeClasses.textMuted}`}
                        >
                          <Globe size={12} className="text-blue-500" />{" "}
                          {locale.LobbyLiveBroadcast.RegionLabel}
                        </label>
                        <select
                          className={`w-full bg-transparent border rounded-xl px-3 py-2 text-[11px] font-bold outline-none ${isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-700"}`}
                          value={streamLobby.area}
                          onChange={(e) =>
                            updateConfig("tournament", {
                              stream: {
                                ...streamLobby,
                                area: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="Any">
                            {locale.LobbyLiveBroadcast.ListRegions.Any}
                          </option>
                          <option value="Europe">
                            {locale.LobbyLiveBroadcast.ListRegions.Europe}
                          </option>
                          <option value="Asia">
                            {locale.LobbyLiveBroadcast.ListRegions.Asia}
                          </option>
                          <option value="North America">
                            {locale.LobbyLiveBroadcast.ListRegions.NorthAmerica}
                          </option>
                          <option value="South America">
                            {locale.LobbyLiveBroadcast.ListRegions.SouthAmerica}
                          </option>
                          <option value="Africa">
                            {locale.LobbyLiveBroadcast.ListRegions.Africa}
                          </option>
                        </select>
                      </div>

                      {/* 2. Language */}
                      <div className="space-y-1.5 opacity-70">
                        <label
                          className={`text-[9px] font-black uppercase flex items-center gap-2 ${themeClasses.textMuted}`}
                        >
                          <Languages size={12} className="text-blue-500" />{" "}
                          {locale.LobbyLiveBroadcast.LanguageLabel}
                        </label>
                        <input
                          type="text"
                          value={locale.LobbyLiveBroadcast.TypeConnection.Any}
                          readOnly
                          className={`w-full bg-slate-500/5 border border-dashed rounded-xl px-3 py-2 text-[11px] font-bold cursor-not-allowed ${themeClasses.textMuted}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* 3. Type connection */}
                      <div className="space-y-1.5">
                        <label
                          className={`text-[9px] font-black uppercase flex items-center gap-2 ${themeClasses.textMuted}`}
                        >
                          <Zap
                            size={12}
                            className="text-amber-500 text-blue-500"
                          />{" "}
                          {locale.LobbyLiveBroadcast.TypeConnection.Label}
                        </label>
                        <select
                          className={`w-full bg-transparent border rounded-xl px-3 py-2 text-[11px] font-bold outline-none ${isDark ? "border-white/10" : "border-slate-200"}`}
                          value={streamLobby.connection}
                          onChange={(e) =>
                            updateConfig("tournament", {
                              stream: {
                                ...streamLobby,
                                connection: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="Any">
                            {locale.LobbyLiveBroadcast.TypeConnection.Any}
                          </option>
                          <option value="LAN">
                            {locale.LobbyLiveBroadcast.TypeConnection.Lan}
                          </option>
                        </select>
                      </div>

                      {/* 4. Crossplatform */}
                      <div className="space-y-1.5">
                        <label
                          className={`text-[9px] font-black uppercase flex items-center gap-2 ${themeClasses.textMuted}`}
                        >
                          <Cpu size={12} className="text-blue-500" />{" "}
                          {locale.LobbyLiveBroadcast.CrossplatformLabel}
                        </label>
                        <select
                          className={`w-full bg-transparent border rounded-xl px-3 py-2 text-[11px] font-bold outline-none ${isDark ? "border-white/10" : "border-slate-200"}`}
                          value={streamLobby.crossplatform}
                          onChange={(e) => {
                            // КРИТИЧЕСКИЙ МОМЕНТ: сравниваем строку с "true", чтобы получить чистый bool
                            const boolValue = e.target.value === "true";
                            updateConfig("tournament", {
                              stream: {
                                ...streamLobby,
                                crossplatform: boolValue,
                              },
                            });
                          }}
                        >
                          <option value="true">
                            {locale.LobbyLiveBroadcast.ListCrossplatform.Yes}
                          </option>
                          <option value="false">
                            {locale.LobbyLiveBroadcast.ListCrossplatform.No}
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* 5. Passcode */}
                    <div className="space-y-1.5 pt-2">
                      <label
                        className={`text-[9px] font-black uppercase flex items-center gap-2 ${themeClasses.textMuted}`}
                      >
                        <Key size={12} className="text-blue-500" />{" "}
                        {locale.LobbyLiveBroadcast.AccessCodeLabel}
                      </label>
                      <input
                        type="number"
                        value={streamLobby.passcode}
                        onChange={(e) =>
                          updateConfig("tournament", {
                            stream: {
                              ...streamLobby,
                              passcode: e.target.value,
                            },
                          })
                        }
                        placeholder="0000"
                        className={`w-full bg-transparent border rounded-xl px-3 py-2 text-[11px] font-black tracking-widest outline-none transition-all focus:border-emerald-500/50 ${isDark ? "border-white/10" : "border-slate-200"}`}
                      />
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
                className={`flex items-center gap-2 border-b pb-3 ${isDark ? "border-white/5" : "border-slate-100"}`}
              >
                <ImagePlus size={16} className="text-blue-500" />
                <span
                  className={`text-[10px] font-black uppercase italic ${themeClasses.textMuted}`}
                >
                  {locale.ConfigurationLogo.Label}
                </span>
              </div>
              <div className="flex gap-4 items-start">
                <div
                  className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-all ${isDark ? "border-white/10 bg-black/40" : "border-slate-200 bg-white shadow-inner"}`}
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
                    <label
                      className={`text-[8px] font-black uppercase italic px-1 ${themeClasses.textMuted}`}
                    >
                      {locale.ConfigurationLogo.UrlImageLabel}
                    </label>
                    {tourneyCfg?.logo?.img ? (
                      <input
                        type="text"
                        placeholder="https://imgur.com/..."
                        value={tourneyCfg?.logo?.img}
                        onChange={(e) =>
                          updateConfig("tournament", {
                            ...tourneyCfg,
                            logo: { img: e.target.value },
                          })
                        }
                        className={`w-full rounded-xl px-3 py-2 text-[10px] border font-mono transition-all ${themeClasses.input}`}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="https://imgur.com/..."
                        value={""}
                        onChange={(e) =>
                          updateConfig("tournament", {
                            logo: { img: e.target.value },
                          })
                        }
                        className={`w-full rounded-xl px-3 py-2 text-[10px] border font-mono transition-all ${themeClasses.input}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ValidationAlertModal
        isOpen={validationAlert.isOpen}
        message={validationAlert.message}
        theme={theme}
        onClose={() => setValidationAlert({ isOpen: false, message: "" })}
        locale={localeValidation}
      />
    </PanelTemplate>
  );
};

export default NotificationSystemPlate;
