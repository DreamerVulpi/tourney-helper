import React, { useCallback, useState } from "react";
import {
  UserCog,
  Plus,
  Key,
  Languages,
  TextAlignStart,
  Server,
  ScrollText,
  HardDriveDownload,
  X,
  SquareMousePointer,
  Blocks,
  Trophy,
  Send,
  Gamepad2,
} from "lucide-react";
import { Field } from "../components/ui/Field.jsx";
import { PlatformBtn } from "../components/ui/PlatformButton.jsx";
import { useAppStore } from "../store/useAppStore";
import { useThemeClasses } from "../hooks/App/useThemeClasses";
import { getThemeClasses } from "../utils/themeClasses";
import PanelTemplate from "../components/layout/PanelTemplate";
import { useTournamentPlatform } from "../hooks/useTournamentPlatform.jsx";
import { useMessengerAuth } from "../hooks/useMessengerAuth.jsx";
import { locales } from "../utils/listLocales.js";
import { updatePlatformSlot, isSlotOccupied } from "../utils/authorizations";
import {
  AUTH_STATUS,
  AUTH_STATUS_META,
  authStatusLocaleKey,
  isAuthorized,
  needsReauth,
} from "../utils/authStatus";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { DeleteClientToken } from "../../wailsjs/go/application/App";
import { TabbedSection } from "../components/ui/tabbedSection.jsx";

// ============================================================
// Компонент слота
// ============================================================
const SlotCard = ({
  index,
  isActive,
  client,
  onSelect,
  onRemove,
  onNameChange,
  locale,
  themeClasses,
}) => {
  const isOccupied = isSlotOccupied(client);
  const status = client?.status || AUTH_STATUS.UNKNOWN;
  const meta = AUTH_STATUS_META[status] || AUTH_STATUS_META[AUTH_STATUS.UNKNOWN];
  const statusText = locale?.[authStatusLocaleKey(status)] || status;

  const COLOR_CLASSES = {
    slate: "text-slate-400",
    blue: "text-blue-400",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    orange: "text-orange-500",
    red: "text-red-500",
  };
  const statusColor = COLOR_CLASSES[meta.color] || "text-slate-400";

  const containerClass = isActive
    ? "border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
    : isOccupied
      ? `${meta.borderClass} ${meta.bgClass} ${meta.hoverClass}`
      : themeClasses.field;

  return (
    <div
      onClick={onSelect}
      className={`
        relative flex flex-col items-center justify-center p-2 h-[4.5rem]
        rounded-xl border cursor-pointer transition-all duration-200 group/slot
        ${containerClass}
      `}
      title={client?.statusReason || statusText}
    >
      <span
        className={`absolute top-1 left-1.5 text-[8px] font-black ${
          isAuthorized(status)
            ? "text-emerald-500"
            : needsReauth(status)
              ? "text-orange-500"
              : isOccupied
                ? "text-amber-500"
                : "text-slate-400"
        }`}
      >
        #{index + 1}
      </span>

      {(isOccupied || isActive) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center transition-opacity z-10 ${
            isActive ? "opacity-100" : "opacity-0 group-hover/slot:opacity-100"
          }`}
        >
          <X size={10} />
        </button>
      )}

      {isOccupied ? (
        <>
          {isActive ? (
            <input
              type="text"
              value={client.name || ""}
              maxLength={17}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onNameChange(e.target.value.slice(0, 17))}
              placeholder={`Client #${index + 1}`}
              className={`
                w-full bg-slate-900/40 text-[9px] font-bold text-slate-200
                text-center leading-tight px-1 py-0.5
                border border-blue-500/40 rounded
                focus:border-blue-500 focus:outline-none
                placeholder:text-slate-500
              `}
            />
          ) : (
            <span
              className="text-[9px] font-bold text-center leading-tight px-1 w-full truncate"
              title={client.name}
            >
              {client.name || `Client #${index + 1}`}
            </span>
          )}

          <div className="flex items-center gap-1 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
            <span
              className={`text-[7px] font-black uppercase italic whitespace-nowrap ${statusColor}`}
            >
              {statusText}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1 opacity-70 group-hover/slot:opacity-100 transition-opacity">
          <Plus size={12} />
          <span className="text-[9px] italic">{locale.Empty}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Основной компонент страницы
// ============================================================
const IntegrationsPlate = ({ locale, updateConfig }) => {
  // ============================================================
  // Стор
  // ============================================================
  const authorizations = useAppStore((s) => s.authorizations);

  const activeAuthorizationSettings = useAppStore(
    (s) => s.activeAuthorizationSettings
  );
  const setActiveAuthorizationSettings = useAppStore(
    (s) => s.setActiveAuthorizationSettings
  );
  const toggleAuthorizationSettings = useAppStore(
    (s) => s.toggleAuthorizationSettings
  );

  const activeSlotIndex = useAppStore((s) => s.activeSlotIndex);
  const setActiveSlotIndex = useAppStore((s) => s.setActiveSlotIndex);

  const setCategorySelectionIntegration = useAppStore((s) => s.setCategorySelectionIntegration);
  const setActiveCategoryIntegration = useAppStore((s) => s.setActiveCategoryIntegration)

  const activeCategory = useAppStore((s)=> s.activeCategoryIntegration);
  const setActiveCategory = useAppStore((s)=> s.setActiveCategoryIntegration);

  const activeDeliveryMethod = useAppStore((s) => s.activeDeliveryMethod);
  const setActiveDeliveryMethod = useAppStore((s) => s.setActiveDeliveryMethod);

  const activeTournamentPlatform = useAppStore(
    (s) => s.activeTournamentPlatform
  );
  const setActiveTournamentPlatform = useAppStore(
    (s) => s.setActiveTournamentPlatform
  );

  const setAuthFlags = useAppStore((s) => s.setAuthFlags);

  // ============================================================
  // Тема
  // ============================================================
  const themeClasses = useThemeClasses(getThemeClasses);

  // ============================================================
  // Хелперы для работы со слотами
  // ============================================================
  const getPlatform = (id) => authorizations?.[id] || { activeSlot: -1, slots: [] };

  const getSlots = (id) => {
    const p = getPlatform(id);
    const arr = p.slots ? [...p.slots] : [];
    while (arr.length < 5) arr.push({});
    return arr;
  };

  const getCurrentSlot = () => {
    if (activeSlotIndex === null) return null;
    return getSlots(activeAuthorizationSettings)[activeSlotIndex] || {};
  };

  // ============================================================
  // Обновление поля в текущем слоте
  // ============================================================
  const patchSlot = (patch) => {
    if (activeSlotIndex === null) return;

    const invalidates = ["clientID", "secretClient", "token", "guildID"].some(
      (k) => k in patch
    );

    const finalPatch = invalidates
      ? { ...patch, status: AUTH_STATUS.UNAUTHORIZED, statusReason: "" }
      : patch;

    updateConfig("authorizations", {
      [activeAuthorizationSettings]: updatePlatformSlot(
        getPlatform(activeAuthorizationSettings),
        activeSlotIndex,
        finalPatch
      ),
    });
  };

  const patchRoles = (patch) => {
    const current = getCurrentSlot();
    patchSlot({
      roles: {
        ...(current?.roles || {}),
        ...patch,
      },
    });
  };

  // ============================================================
  // Авторизация
  // ============================================================
  const invalidateAuth = () => {
    setAuthFlags((prev) => ({
      ...prev,
      [activeAuthorizationSettings]: false,
    }));
  };

  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });

  const handleDefaultLocaleChange = useCallback(
    (value) => {
      patchRoles({ default: value });
    },
    [activeAuthorizationSettings, activeSlotIndex, authorizations]
  );

  const TOURNAMENT_IDS = ["startgg", "challonge"];
  const MESSENGER_IDS = ["discord", "telegram"];

  const closeSettings = useCallback(() => {
    setActiveAuthorizationSettings(null);
    setActiveSlotIndex(null);
    setActiveTournamentPlatform(null);
    setActiveDeliveryMethod(null);
  }, [
    setActiveAuthorizationSettings,
    setActiveSlotIndex,
    setActiveTournamentPlatform,
    setActiveDeliveryMethod,
  ]);

  const toggleSettings = useCallback(
    (id) => {
      toggleAuthorizationSettings(id);
    },
    [toggleAuthorizationSettings]
  );

  const handleSlotSelect = (index) => {
    if (activeSlotIndex === index) {
      setActiveSlotIndex(null);
      setCategorySelectionIntegration(activeCategory, {
        platform: activeAuthorizationSettings,
        slotIndex: null,
      });
      return;
    }

    const slot = getSlots(activeAuthorizationSettings)[index];
    if (!isSlotOccupied(slot)) {
      updateConfig("authorizations", {
        [activeAuthorizationSettings]: updatePlatformSlot(
          getPlatform(activeAuthorizationSettings),
          index,
          { id: crypto.randomUUID(), name: `Client #${index + 1}`, created: true }
        ),
      });
    }

    setActiveSlotIndex(index);
    setCategorySelectionIntegration(activeCategory, {
      platform: activeAuthorizationSettings,
      slotIndex: index,
    });
  };

  const handleSlotRemove = async (index) => {
    try {
      await DeleteClientToken(activeAuthorizationSettings, index);
    } catch (err) {
      console.warn("[handleSlotRemove] failed to delete token file:", err);
    }

    updateConfig("authorizations", {
      [activeAuthorizationSettings]: updatePlatformSlot(
        getPlatform(activeAuthorizationSettings),
        index,
        null
      ),
    });

    if (activeSlotIndex === index) {
      setActiveSlotIndex(null);
      setCategorySelectionIntegration(activeCategory, {
        platform: activeAuthorizationSettings,
        slotIndex: null,
      });
    }
  };

  // ============================================================
  // Хуки авторизации платформ
  // ============================================================
  const { handleMessengerClick, authorizeMessengerSlot } = useMessengerAuth({
    locale,
    activeDeliveryMethod,
    setActiveDeliveryMethod,
    setAuthFlags,
    setValidationAlert,
    authorizations,
    activeSlotIndex,
    updateConfig,
    updatePlatformSlot,
  });

  const { handleTournamentPlatformClick, authorizeTournamentSlot } =
    useTournamentPlatform({
      locale,
      activeTournamentPlatform,
      setActiveTournamentPlatform,
      setAuthFlags,
      setValidationAlert,
      authorizations,
      activeSlotIndex,
      updateConfig,
      updatePlatformSlot,
    });

  const getAuthorizedCount = (id) =>
    getSlots(id).filter((s) => s.status === AUTH_STATUS.AUTHORIZED).length;

  const getReauthCount = (id) =>
    getSlots(id).filter((s) => needsReauth(s.status)).length;

  const getOccupiedCount = (id) =>
    getSlots(id).filter(isSlotOccupied).length;

  const handleSlotNameChange = (index, value) => {
    updateConfig("authorizations", {
      [activeAuthorizationSettings]: updatePlatformSlot(
        getPlatform(activeAuthorizationSettings),
        index,
        { name: value.slice(0, 17) }
      ),
    });
  };

  const CATEGORY_TABS = [
    { id: "tournament", icon: Trophy,   label: locale.TourneyLabel },
    { id: "delivery",   icon: Send,     label: locale.DeliveryMethodLabel },
  ];

  const handlePlatformClick = useCallback(
  (id) => {
    if (activeAuthorizationSettings === id) {
      closeSettings();
      setCategorySelectionIntegration(activeCategory, { platform: null, slotIndex: null });
      return;
    }

    if (TOURNAMENT_IDS.includes(id)) {
      handleTournamentPlatformClick(id);
    } else if (MESSENGER_IDS.includes(id)) {
      handleMessengerClick(id);
    }

    setActiveAuthorizationSettings(id);
    setActiveSlotIndex(null);
    setCategorySelectionIntegration(activeCategory, { platform: id, slotIndex: null });

    if (TOURNAMENT_IDS.includes(id)) {
      setActiveTournamentPlatform(id);
      setActiveDeliveryMethod(null);
    } else if (MESSENGER_IDS.includes(id)) {
      setActiveDeliveryMethod(id);
      setActiveTournamentPlatform(null);
    }
  },
  [
    activeCategory,
    activeAuthorizationSettings,
    closeSettings,
    handleTournamentPlatformClick,
    handleMessengerClick,
    setActiveAuthorizationSettings,
    setActiveSlotIndex,
    setCategorySelectionIntegration,        
    setActiveTournamentPlatform,
    setActiveDeliveryMethod,
  ]
);

  const currentStatus = getCurrentSlot()?.status;
  const isAuthorizeDisabled =
    currentStatus === AUTH_STATUS.PENDING ||
    currentStatus === AUTH_STATUS.AUTHORIZED;

  const handleCategoryChange = (id) => {
    if (id === activeCategory) return;

    const { categorySelectionIntegration, setCategorySelectionIntegration  } = useAppStore.getState();

    // Сохраняем текущее
    setCategorySelectionIntegration(activeCategory, {
      platform: activeAuthorizationSettings,
      slotIndex: activeSlotIndex,
    });

    // Переключаем
    setActiveCategoryIntegration(id);

    // Читаем свежее из стора
    const saved = categorySelectionIntegration[id];
    if (saved?.platform) {
      setActiveAuthorizationSettings(saved.platform);
      setActiveSlotIndex(saved.slotIndex ?? null);

      if (TOURNAMENT_IDS.includes(saved.platform)) {
        setActiveTournamentPlatform(saved.platform);
        setActiveDeliveryMethod(null);
      } else if (MESSENGER_IDS.includes(saved.platform)) {
        setActiveDeliveryMethod(saved.platform);
        setActiveTournamentPlatform(null);
      }
    } else {
      setActiveAuthorizationSettings(null);
      setActiveSlotIndex(null);
    }
    console.log("after set:", {
    categorySelectionAfter: useAppStore.getState().categorySelection,
    saved: useAppStore.getState().categorySelection[id],
  });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <PanelTemplate themeClasses={themeClasses}>
      {/* Горизонтальные вкладки */}
       <TabbedSection
        tabs={CATEGORY_TABS}
        activeTab={activeCategory}
        onChange={handleCategoryChange}
        themeClasses={themeClasses}
        padding="p-4"
        rounding="rounded-2xl"
        className="flex-1 min-h-0"
      > 
        <div className="grid grid-cols-16 gap-8 items-stretch flex-1 min-h-0 w-full">
          <div className="col-span-4 flex flex-col min-h-0">
            <div className="space-y-2 custom-scrollbar pr-2 flex-1">
              {activeCategory === "tournament" && (
                <>
                  <PlatformBtn
                    label="Start.gg"
                    authorizedCount={getAuthorizedCount("startgg")}
                    reauthCount={getReauthCount("startgg")}
                    slotsCount={getOccupiedCount("startgg")}
                    active={activeAuthorizationSettings === "startgg"}
                    onClick={() => handlePlatformClick("startgg")}
                    themeClasses={themeClasses}
                  />
                  <PlatformBtn label="Challonge (WIP)" themeClasses={themeClasses} locked />
                  <PlatformBtn label="Toornament (WIP)" themeClasses={themeClasses} locked />
                </>
              )}

              {activeCategory === "delivery" && (
                <>
                  <PlatformBtn
                    label="Discord"
                    active={activeAuthorizationSettings === "discord"}
                    onClick={() => handlePlatformClick("discord")}
                    themeClasses={themeClasses}
                    slotsCount={getOccupiedCount("discord")}
                    authorizedCount={getAuthorizedCount("discord")}
                    reauthCount={getReauthCount("discord")}
                  />
                  <PlatformBtn label="Telegram (WIP)" themeClasses={themeClasses} locked />
                  <PlatformBtn label="E-mail (WIP)"   themeClasses={themeClasses} locked />
                </>
              )}
            </div>
          </div>
          
          <div className="col-span-12 flex flex-col h-full min-h-0">
            {!activeAuthorizationSettings ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                <EmptyState
                  icon={SquareMousePointer}
                  title={locale.EmptyFieldHeader}
                  description={locale.EmptyFieldHint}
                />
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                {/* Заголовок */}
                <div className="flex items-center justify-between border-b pb-2 mb-4 border-current/5 shrink-0">
                  <h4 className="text-[0.625rem] font-black uppercase text-amber-500 italic flex items-center gap-3">
                    <Blocks size={12} />
                    {activeAuthorizationSettings} — {locale.ClientsLabel} (
                    {getOccupiedCount(activeAuthorizationSettings)}/5)
                  </h4>
                  <button
                    onClick={() => {
                      setActiveAuthorizationSettings(null);
                      setActiveSlotIndex(null);
                      setCategorySelectionIntegration(activeCategory, { platform: null, slotIndex: null });
                    }}
                    className="text-slate-500 hover:text-amber-500 transition-colors"
                  >
                    <Plus className="rotate-45" size={14} />
                  </button>
                </div>

                {/* Сетка 5 слотов */}
                <div className="grid grid-cols-5 gap-2 shrink-0">
                  {getSlots(activeAuthorizationSettings).map((client, index) => (
                    <SlotCard
                      key={index}
                      index={index}
                      isActive={activeSlotIndex === index}
                      client={client}
                      onSelect={() => handleSlotSelect(index)}
                      onRemove={() => handleSlotRemove(index)}
                      onNameChange={(value) => handleSlotNameChange(index, value)}
                      locale={locale.Platform.AuthorizationStatuses}
                      themeClasses={themeClasses}
                    />
                  ))}
                </div>

                {/* ===== Форма для выбранного слота ===== */}
                {activeSlotIndex !== null && (
                  <div className="flex-1 min-h-0 custom-scrollbar pt-3 pr-2 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-blue-400 italic">
                        {locale.ClientSettings} #{activeSlotIndex + 1}
                      </span>
                      <div className="flex-1 h-px bg-slate-700/50" />
                    </div>

                    {/* --- ФОРМА ДЛЯ START.GG / CHALLONGE --- */}
                    {(activeAuthorizationSettings === "startgg" ||
                      activeAuthorizationSettings === "challonge") && (
                      <div className="flex flex-col min-h-0 gap-3">
                        <Field
                          label={locale.Platform.RedirectURL}
                          variant="copy"
                          value={`http://127.0.0.1:7310/${activeAuthorizationSettings}/callback`}
                          icon={HardDriveDownload}
                          themeClasses={themeClasses}
                        />

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Field
                            label="CLIENT ID*"
                            icon={TextAlignStart}
                            value={getCurrentSlot()?.clientID || ""}
                            onChange={(v) => {
                              invalidateAuth();
                              patchSlot({ clientID: v });
                            }}
                            themeClasses={themeClasses}
                          />
                          <Field
                            label="SECRET CLIENT*"
                            variant="password"
                            icon={Key}
                            isSecret
                            value={getCurrentSlot()?.secretClient || ""}
                            onChange={(v) => {
                              invalidateAuth();
                              patchSlot({ secretClient: v });
                            }}
                            themeClasses={themeClasses}
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() =>
                              authorizeTournamentSlot(
                                activeAuthorizationSettings,
                                activeSlotIndex
                              )
                            }
                            disabled={isAuthorizeDisabled}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase italic transition-colors ${
                              isAuthorizeDisabled
                                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-500 text-white"
                            }`}
                          >
                            {getCurrentSlot()?.status === AUTH_STATUS.PENDING
                              ? locale.AuthorizeButtonLabel
                              : locale.SignInButtonLabel}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* --- ФОРМА ДЛЯ DISCORD / TELEGRAM --- */}
                    {(activeAuthorizationSettings === "discord" ||
                      activeAuthorizationSettings === "telegram") && (
                      <>
                        {activeAuthorizationSettings === "discord" && (
                          <Field
                            label={locale.Platform.RedirectURL}
                            variant="copy"
                            value="http://127.0.0.1:7310/discord/callback"
                            icon={HardDriveDownload}
                            themeClasses={themeClasses}
                          />
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <Field
                            label={locale.Platform.TokenBot + "*"}
                            icon={Key}
                            variant="password"
                            value={getCurrentSlot()?.token || ""}
                            onChange={(v) => {
                              invalidateAuth();
                              patchSlot({ token: v });
                            }}
                            themeClasses={themeClasses}
                          />
                          <Field
                            label={locale.Platform.DefaultLocale}
                            variant="select"
                            value={getCurrentSlot()?.roles?.default || "en"}
                            icon={Languages}
                            onChange={handleDefaultLocaleChange}
                            items={locales}
                            themeClasses={themeClasses}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Field
                            label="GUILD ID*"
                            icon={Server}
                            value={getCurrentSlot()?.guildID || ""}
                            onChange={(v) => {
                              invalidateAuth();
                              patchSlot({ guildID: v });
                            }}
                            themeClasses={themeClasses}
                          />
                          <Field
                            label="LOG CHANNEL ID"
                            icon={ScrollText}
                            value={getCurrentSlot()?.debugChannelID || ""}
                            onChange={(v) => patchSlot({ debugChannelID: v })}
                            themeClasses={themeClasses}
                          />
                          <Field
                            label="CLIENT ID*"
                            icon={TextAlignStart}
                            value={getCurrentSlot()?.clientID || ""}
                            onChange={(v) => {
                              invalidateAuth();
                              patchSlot({ clientID: v });
                            }}
                            themeClasses={themeClasses}
                          />
                          <Field
                            label="SECRET CLIENT*"
                            icon={Key}
                            variant="password"
                            value={getCurrentSlot()?.secretClient || ""}
                            onChange={(v) => {
                              invalidateAuth();
                              patchSlot({ secretClient: v });
                            }}
                            themeClasses={themeClasses}
                          />
                          <Field
                            label="ROLE ID - RU"
                            icon={Languages}
                            value={getCurrentSlot()?.roles?.ru || ""}
                            onChange={(v) => patchRoles({ ru: v })}
                            themeClasses={themeClasses}
                          />
                          <Field
                            label="ROLE ID - EN"
                            icon={Languages}
                            value={getCurrentSlot()?.roles?.en || ""}
                            onChange={(v) => patchRoles({ en: v })}
                            themeClasses={themeClasses}
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() =>
                              authorizeMessengerSlot(
                                activeAuthorizationSettings,
                                activeSlotIndex
                              )
                            }
                            disabled={
                              getCurrentSlot()?.status === AUTH_STATUS.PENDING
                            }
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase italic transition-colors ${
                              isAuthorizeDisabled
                                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-500 text-white"
                            }`}
                          >
                            {getCurrentSlot()?.status === AUTH_STATUS.PENDING
                              ? locale.AuthorizeButtonLabel
                              : locale.SignInButtonLabel}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TabbedSection>
    </PanelTemplate>
  );
};

export default IntegrationsPlate;