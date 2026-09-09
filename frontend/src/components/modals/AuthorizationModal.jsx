import React, { useState, useEffect, useCallback } from "react";
import { Field } from "../ui/Field.jsx";
import {
  UserCog,
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
import { Modal } from "../modals/Modal.jsx";
import { PlatformBtn } from "../../components/ui/PlatformButton.jsx";
import { useTournamentPlatform } from "../../hooks/useTournamentPlatform.jsx";
import { useMessengerAuth } from "../../hooks/useMessengerAuth.jsx";
import { locales } from "../../utils/listLocales.js";

const AuthorizationModal = ({
  isOpen,
  onClose,
  locale,

  activeAuthorizationSettings,
  setActiveAuthorizationSettings,

  activeDeliveryMethod,
  setActiveDeliveryMethod,
  activeTournamentPlatform,
  setActiveTournamentPlatform,
  authStatus,
  setAuthStatus,

  updateConfig,
  systemCfg,
  tourneyCfg,

  themeClasses,
}) => {
    // Field was edited
      const invalidateAuth = () => {
        setAuthStatus((prev) => ({
          ...prev,
          [activeAuthorizationSettings]: false,
        }));
      };
    // Get locale for label params bot
    const localeLabelParamsBot = locale.Platform.ParamsBot.split("%v");
    // State for revial validation alert
    const [validationAlert, setValidationAlert] = useState({
        isOpen: false,
        message: "",
    });
    const handleDefaultLocaleChange = useCallback((value) => {
        updateConfig("system", {
          ...systemCfg,
          [activeAuthorizationSettings]: {
            ...systemCfg[activeAuthorizationSettings],
            roles: {
              ...systemCfg[activeAuthorizationSettings]?.roles,
              default: value,
            },
          },
        });
      }, [updateConfig])
    // Settings icon button for platforms
    const toggleSettings = useCallback((id) => {
        setActiveAuthorizationSettings((prev) => (prev === id ? null : id));
    }, []);
    // Handler for messenger auth button
      const { handleMessengerClick } = useMessengerAuth({
        systemCfg,
        locale,
        activeDeliveryMethod,
        setActiveDeliveryMethod,
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
        activeTournamentPlatform,
        setActiveTournamentPlatform,
        setAuthStatus,
        setValidationAlert,
    });
    const handleStartggClick = useCallback(() => {
        handleTournamentPlatformClick("startgg");
    }, [handleTournamentPlatformClick]);
    const handleStartggSettingsClick = useCallback(() => {
        toggleSettings("startgg");
    }, []);

    // Field of ID roles
  const roles = systemCfg?.[activeAuthorizationSettings]?.roles || { ru: "", en: "" };

  const content = (
    <div className={`p-6 max-h-[70vh] overflow-y-auto space-y-6`}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-blue-500 italic px-1">
            {locale.Platform.Tourney}
            </span>
            <PlatformBtn
                label="Start.gg"
                active={activeTournamentPlatform === "startgg"}
                auth={authStatus?.startgg}
                onClick={handleStartggClick}
                onSettingsClick={handleStartggSettingsClick}
                themeClasses={themeClasses}
                locale={locale.Platform.AuthorizeStatePlatform}
            />
            {/* In future updates */}
            <PlatformBtn
                label="Challonge (WIP)"
                // active={activeTournamentPlatform === "challonge"}
                // auth={authStatus?.challonge}
                // onClick={() => handleTournamentPlatformClick("challonge")}
                onSettingsClick={() => toggleSettings("challonge")}
                themeClasses={themeClasses}
                locale={locale.Platform.AuthorizeStatePlatform}
                />
        </div>
        <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-blue-500 italic px-1">
            {locale.Platform.DeliveryMethod}
            </span>
            <PlatformBtn
                label="Discord"
                active={activeDeliveryMethod === "discord"}
                auth={authStatus?.discord}
                onClick={handleDiscordClick}
                onSettingsClick={handleDiscordSettingsClick}
                themeClasses={themeClasses}
                locale={locale.Platform.AuthorizeStatePlatform}
            />
            <PlatformBtn
                label="Telegram (WIP)"
                // active={activeDeliveryMethod === "telegram"}
                // auth={authStatus?.telegram}
                // onClick={() => handleMessengerClick("telegram")
                // }
                onSettingsClick={() => toggleSettings("telegram")}
                themeClasses={themeClasses}
                locale={locale.Platform.AuthorizeStatePlatform}
            />
            <PlatformBtn
                label="E-mail (WIP)"
                // active={activeDeliveryMethod === "telegram"}
                // auth={authStatus?.telegram}
                // onClick={() => handleMessengerClick("telegram")
                // }
                onSettingsClick={() => toggleSettings("telegram")}
                themeClasses={themeClasses}
                locale={locale.Platform.AuthorizeStatePlatform}
            />
        </div>
        </div>

        {(activeAuthorizationSettings === "startgg" || activeAuthorizationSettings === "challonge") && (
        <section
            className={`p-4 rounded-2xl border space-y-3 ${themeClasses.tempSection}`}
        >
            <div className="flex items-center justify-between border-b pb-2 border-current/5">
            <h4 className="text-[0.625rem] font-black uppercase text-amber-500 italic">
                {locale.Platform.DownloadSettings} - {activeAuthorizationSettings}
            </h4>
            <button
                onClick={() => setActiveAuthorizationSettings(null)}
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
                value={tourneyCfg[activeAuthorizationSettings]?.clientID || ""}
                onChange={(value) => {
                    invalidateAuth();
                    updateConfig("tournament", {
                    ...tourneyCfg,
                    [activeAuthorizationSettings]: {
                        ...tourneyCfg[activeAuthorizationSettings],
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
                value={tourneyCfg[activeAuthorizationSettings]?.secretClient || ""}
                themeClasses={themeClasses}
                onChange={(value) => {
                    invalidateAuth();
                    updateConfig("tournament", {
                    ...tourneyCfg,
                    [activeAuthorizationSettings]: {
                        ...tourneyCfg[activeAuthorizationSettings],
                        secretClient: value,
                    },
                    });
                }}
            />
            </div>
        </section>
        )}

        {(activeAuthorizationSettings === "discord" || activeAuthorizationSettings == "telegram") && (
        <section
            className={`p-4 rounded-2xl border space-y-3 duration-300 max-h-[40vh] custom-scrollbar overflow-y-auto ${themeClasses.tempSection}`}
        >
            <div className="flex items-center justify-between border-b pb-2 border-current/5">
            <h4 className="text-[9px] font-black uppercase text-blue-500 italic">
                {localeLabelParamsBot[0]} {localeLabelParamsBot[1]} - {activeAuthorizationSettings} 
            </h4>
            <button
                onClick={() => setActiveAuthorizationSettings(null)}
                className="text-slate-500 hover:text-blue-500"
            >
                <Plus className="rotate-45" size={14} />
            </button>
            </div>

            {activeAuthorizationSettings === "discord" && (
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
            <div className="grid grid-cols-2 gap-2 pt-1">
            <Field
                label={locale.Platform.TokenBot+"*"}
                icon={Key}
                variant="password"
                value={systemCfg[activeAuthorizationSettings]?.token}
                themeClasses={themeClasses}
                onChange={(value) => {
                    invalidateAuth();
                    updateConfig("system", {
                    ...systemCfg,
                    [activeAuthorizationSettings]: {
                        ...systemCfg[activeAuthorizationSettings],
                        token: value,
                    },
                    });
                }}
            />
            <Field
            label={locale.Platform.DefaultLocale}
            variant="select"
            value={systemCfg[activeAuthorizationSettings]?.roles?.default}
            icon={Languages}
            themeClasses={themeClasses}
            onChange={handleDefaultLocaleChange}
            items={locales}
            />
            </div>

            {(activeAuthorizationSettings === "discord" ||
            activeAuthorizationSettings === "telegram") && (
            <>
                <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                    <Field
                    label={"GUILD ID*"}
                    icon={Server}
                    value={systemCfg?.[activeAuthorizationSettings]?.guildID}
                    onChange={(value) => {
                        invalidateAuth();
                        updateConfig("system", {
                        ...systemCfg,
                        [activeAuthorizationSettings]: {
                            ...systemCfg[activeAuthorizationSettings],
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
                    value={systemCfg?.[activeAuthorizationSettings]?.debugChannelID}
                    themeClasses={themeClasses}
                    onChange={(value) => {
                        updateConfig("system", {
                        ...systemCfg,
                        [activeAuthorizationSettings]: {
                            ...systemCfg[activeAuthorizationSettings],
                            debugChannelID: value,
                        },
                        });
                    }}
                    />
                </div>
                <div className="space-y-1">
                    <Field
                    label={"CLIENT ID*"}
                    value={systemCfg?.[activeAuthorizationSettings]?.clientID}
                    icon={TextAlignStart}
                    onChange={(value) => {
                        invalidateAuth();
                        updateConfig("system", {
                        ...systemCfg,
                        [activeAuthorizationSettings]: {
                            ...systemCfg[activeAuthorizationSettings],
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
                        [activeAuthorizationSettings]: {
                            ...systemCfg[activeAuthorizationSettings],
                            roles: {
                            ...systemCfg[activeAuthorizationSettings]?.roles,
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
                    value={systemCfg?.[activeAuthorizationSettings]?.secretClient}
                    onChange={(value) => {
                        invalidateAuth();
                        updateConfig("system", {
                        ...systemCfg,
                        [activeAuthorizationSettings]: {
                            ...systemCfg[activeAuthorizationSettings],
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
                        [activeAuthorizationSettings]: {
                            ...systemCfg[activeAuthorizationSettings],
                            roles: {
                            ...systemCfg[activeAuthorizationSettings]?.roles,
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
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        locale.Title
      }
      icon={
        UserCog
      }
      iconColor={
        "blue"
      }
      children={content}
      themeClasses={themeClasses}
    />
  );
};

export default AuthorizationModal;
