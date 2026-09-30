import React, { useCallback } from "react";
import { Field } from "../ui/Field.jsx";
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
  Crown,
} from "lucide-react";
import { Modal } from "../modals/Modal.jsx";
import { PlatformBtn } from "../../components/ui/PlatformButton.jsx";
import { useTournamentPlatform } from "../../hooks/useTournamentPlatform.jsx";
import { useMessengerAuth } from "../../hooks/useMessengerAuth.jsx";
import { locales } from "../../utils/listLocales.js";
import { useAppStore } from "../../store/useAppStore";
import { updatePlatformSlot, isSlotOccupied } from "../../utils/authorizations";
import { AUTH_STATUS, AUTH_STATUS_META, authStatusLocaleKey, isAuthorized, needsReauth } from "../../utils/authStatus";
import { SlotStatusBadge } from "../ui/SlotStatusBadge.jsx";

const SlotCard = ({
  index,
  isActive,
  client,
  onSelect,
  onRemove,
  onNameChange,
  locale,
}) => {
  const isOccupied = isSlotOccupied(client);
  const status = client?.status || AUTH_STATUS.UNKNOWN;
  const meta = AUTH_STATUS_META[status] || AUTH_STATUS_META[AUTH_STATUS.UNKNOWN];
  const statusText = locale?.Platform?.[authStatusLocaleKey(status)] || status;

  const COLOR_CLASSES = {
    slate:   "text-slate-400",
    blue:    "text-blue-400",
    emerald: "text-emerald-400",
    amber:   "text-amber-400",
    orange:  "text-orange-400",
    red:     "text-red-400",
  };
  const statusColor = COLOR_CLASSES[meta.color] || "text-slate-400";

  return (
    <div
      onClick={onSelect}
      className={`
        relative flex flex-col items-center justify-center p-2 h-[4.5rem]
        rounded-xl border cursor-pointer transition-all duration-200 group/slot
        ${isActive
          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
          : `${meta.borderClass} ${meta.bgClass} ${meta.hoverClass}`
        }
      `}
      title={client?.statusReason || statusText}
    >
      <span className={`absolute top-1 left-1.5 text-[8px] font-black ${
        isAuthorized(status) ? "text-emerald-400"
        : needsReauth(status) ? "text-orange-400"
        : isOccupied ? "text-amber-400" : "text-slate-500"
      }`}>
        #{index + 1}
      </span>

      {isOccupied && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity z-10"
        >
          <X size={10} />
        </button>
      )}

      {isOccupied ? (
        <>
          {/* Имя: input только в активном слоте, иначе — span */}
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
              className="text-[9px] font-bold text-slate-200 text-center leading-tight px-1 w-full truncate"
              title={client.name}
            >
              {client.name || `Client #${index + 1}`}
            </span>
          )}

          {/* Статус */}
          <div className="flex items-center gap-1 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
            <span className={`text-[7px] font-black uppercase italic whitespace-nowrap ${statusColor}`}>
              {statusText}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1 text-slate-500 group-hover/slot:text-blue-500 transition-colors">
          <Plus size={12} />
          <span className="text-[9px] italic">Пусто</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Основной компонент
// ============================================================
const AuthorizationModal = ({
  isOpen,
  onClose,
  locale,
  updateConfig,
  themeClasses,
}) => {
  // ============================================================
  // Стор
  // ============================================================
  const authorizations   = useAppStore((s) => s.authorizations);
  const setAuthorizations = useAppStore((s) => s.setAuthorizations);

  const activeAuthorizationSettings = useAppStore((s) => s.activeAuthorizationSettings);
  const setActiveAuthorizationSettings = useAppStore((s) => s.setActiveAuthorizationSettings);
  const toggleAuthorizationSettings = useAppStore((s) => s.toggleAuthorizationSettings);

  const activeSlotIndex   = useAppStore((s) => s.activeSlotIndex);
  const setActiveSlotIndex = useAppStore((s) => s.setActiveSlotIndex);

  const activeDeliveryMethod    = useAppStore((s) => s.activeDeliveryMethod);
  const setActiveDeliveryMethod = useAppStore((s) => s.setActiveDeliveryMethod);

  const activeTournamentPlatform    = useAppStore((s) => s.activeTournamentPlatform);
  const setActiveTournamentPlatform = useAppStore((s) => s.setActiveTournamentPlatform);

  const authStatus     = useAppStore((s) => s.authStatus);
  const setAuthStatus  = useAppStore((s) => s.setAuthStatus);

  // ============================================================
  // Хелперы для работы со слотами
  // ============================================================
  const getPlatform = (id) => authorizations?.[id] || { activeSlot: -1, slots: [] };

  const getSlots = (id) => {
    const p = getPlatform(id);
    // гарантируем длину 5
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

    // Поля, изменение которых делает авторизацию недействительной
    const invalidates = ["clientID", "secretClient", "token", "guildID"]
      .some((k) => k in patch);

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
    setAuthStatus((prev) => ({
      ...prev,
      [activeAuthorizationSettings]: false,
    }));
  };

  const [validationAlert, setValidationAlert] = React.useState({
    isOpen: false,
    message: "",
  });

  // Локаль по умолчанию для Discord/Telegram
  const handleDefaultLocaleChange = useCallback((value) => {
    patchRoles({ default: value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAuthorizationSettings, activeSlotIndex, authorizations]);

  // Открытие/закрытие панели настроек платформы
  const toggleSettings = useCallback((id) => {
    toggleAuthorizationSettings(id);
  }, [toggleAuthorizationSettings]);

  // Клик по слоту: пустой — создаём клиента, занятый — редактируем
  const handleSlotSelect = (index) => {
    if (activeSlotIndex === index) {
      setActiveSlotIndex(null);
      return;
    }

    const slot = getSlots(activeAuthorizationSettings)[index];
    if (!isSlotOccupied(slot)) {
      // создаём пустого клиента с именем по умолчанию
      updateConfig("authorizations", {
        [activeAuthorizationSettings]: updatePlatformSlot(
          getPlatform(activeAuthorizationSettings),
          index,
          { name: `Client #${index + 1}`, created: true }
        ),
      });
    }

    setActiveSlotIndex(index);
  };

  const handleSlotRemove = (index) => {
  // Удаляем слот → заменяем на blank (Created: false)
    updateConfig("authorizations", {
      [activeAuthorizationSettings]: updatePlatformSlot(
        getPlatform(activeAuthorizationSettings),
        index,
        null   // ← именно null означает "очистить"
      ),
    });

    // Если это был активный слот — снимаем выделение
    if (activeSlotIndex === index) {
      setActiveSlotIndex(null);
    }
  };

  // ============================================================
  // Хуки авторизации платформ
  // ============================================================
  const { handleMessengerClick, authorizeMessengerSlot } = useMessengerAuth({
    locale,
    activeDeliveryMethod,
    setActiveDeliveryMethod,
    setAuthStatus,
    setValidationAlert,
    authorizations,
    activeSlotIndex,
    updateConfig,
    updatePlatformSlot,
  });

  const handleDiscordClick = useCallback(() => {
    handleMessengerClick("discord");
  }, [handleMessengerClick]);

  const handleDiscordSettingsClick = useCallback(() => {
    toggleSettings("discord");
  }, [toggleSettings]);

  const { handleTournamentPlatformClick, authorizeTournamentSlot } =
  useTournamentPlatform({
    locale,
    activeTournamentPlatform,
    setActiveTournamentPlatform,
    setAuthStatus,
    setValidationAlert,
    authorizations,
    activeSlotIndex,
    updateConfig,
    updatePlatformSlot,
  });

  const handleStartggClick = useCallback(() => {
    handleTournamentPlatformClick("startgg");
  }, [handleTournamentPlatformClick]);

  const handleStartggSettingsClick = useCallback(() => {
    toggleSettings("startgg");
  }, [toggleSettings]);

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

  // ============================================================
  // RENDER
  // ============================================================
  const content = (
  <div className="p-6 grid grid-cols-8 gap-4 max-h-[75vh]">
    {/* ============================================================ */}
    {/* ЛЕВАЯ КОЛОНКА — ПЛАТФОРМЫ                                     */}
    {/* ============================================================ */}
    <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
      {/* Турнирные платформы */}
      <div className="space-y-2">
        <span className="text-[9px] font-black uppercase text-blue-500 italic px-1">
          {locale.Platform.Tourney}
        </span>
        <PlatformBtn
          label="Start.gg"
          authorizedCount={getAuthorizedCount("startgg")}
          reauthCount={getReauthCount("startgg")}
          slotsCount={getOccupiedCount("startgg")}
          active={activeTournamentPlatform === "startgg"}
          onClick={handleStartggClick}
          onSettingsClick={handleStartggSettingsClick}
          themeClasses={themeClasses}
        />
        <PlatformBtn
          label="Challonge (WIP)"
          themeClasses={themeClasses}
        />
      </div>

      {/* Методы отправки */}
      <div className="space-y-2">
        <span className="text-[9px] font-black uppercase text-blue-500 italic px-1">
          {locale.Platform.DeliveryMethod}
        </span>
        <PlatformBtn
          label="Discord"
          active={activeDeliveryMethod === "discord"}
          onClick={handleDiscordClick}
          onSettingsClick={handleDiscordSettingsClick}
          themeClasses={themeClasses}
          slotsCount={getOccupiedCount("discord")}
          authorizedCount={getAuthorizedCount("discord")}
          reauthCount={getReauthCount("discord")}
        />
        <PlatformBtn
          label="Telegram (WIP)"
          themeClasses={themeClasses}
        />
        <PlatformBtn
          label="E-mail (WIP)"
          themeClasses={themeClasses}
        />
      </div>
    </div>

    {/* ============================================================ */}
    {/* ПРАВАЯ КОЛОНКА — СЛОТЫ + ФОРМА                                */}
    {/* ============================================================ */}
    <div className="col-span-6 overflow-y-auto pr-1">
      {!activeAuthorizationSettings ? (
        <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
          {locale.Platform.SelectPlatformHint || "Выберите платформу слева"}
        </div>
      ) : (
        <section className={`p-4 rounded-2xl border space-y-4 ${themeClasses.tempSection}`}>
          {/* Заголовок */}
          <div className="flex items-center justify-between border-b pb-2 border-current/5">
            <h4 className="text-[0.625rem] font-black uppercase text-amber-500 italic flex items-center gap-2">
              <Crown size={12} />
              {activeAuthorizationSettings} — Клиенты (
              {getOccupiedCount(activeAuthorizationSettings)}/5)
            </h4>
            <button
              onClick={() => {
                setActiveAuthorizationSettings(null);
                setActiveSlotIndex(null);
              }}
              className="text-slate-500 hover:text-amber-500 transition-colors"
            >
              <Plus className="rotate-45" size={14} />
            </button>
          </div>

          {/* Сетка 5 слотов */}
          <div className="grid grid-cols-5 gap-2">
            {getSlots(activeAuthorizationSettings).map((client, index) => (
              <SlotCard
                key={index}
                index={index}
                isActive={activeSlotIndex === index}
                client={client}
                onSelect={() => handleSlotSelect(index)}
                onRemove={() => handleSlotRemove(index)}
                onNameChange={(value) => handleSlotNameChange(index, value)}
                // TODO: Add locale
                locale={locale}
              />
            ))}
          </div>

          {/* ===== Форма для выбранного слота ===== */}
          {activeSlotIndex !== null && (
            <div className="pt-3 border-slate-700/50 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-blue-400 italic">
                  {locale.Platform.SlotSettings || "Настройки слота"} #{activeSlotIndex + 1}
                </span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>

              {/* --- ФОРМА ДЛЯ START.GG / CHALLONGE --- */}
              {(activeAuthorizationSettings === "startgg" ||
                activeAuthorizationSettings === "challonge") && (
                <>
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
                        authorizeTournamentSlot(activeAuthorizationSettings, activeSlotIndex)
                      }
                      disabled={getCurrentSlot()?.status === AUTH_STATUS.PENDING}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase italic transition-colors ${
                        getCurrentSlot()?.status === AUTH_STATUS.PENDING
                          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {getCurrentSlot()?.status === AUTH_STATUS.PENDING
                        ? locale.Platform.Authorizing || "Authorizing..."
                        : locale.Platform.Authorize || "Authorize"}
                    </button>
                  </div>
                </>
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
                        authorizeMessengerSlot(activeAuthorizationSettings, activeSlotIndex)
                      }
                      disabled={getCurrentSlot()?.status === AUTH_STATUS.PENDING}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase italic transition-colors ${
                        getCurrentSlot()?.status === AUTH_STATUS.PENDING
                          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {getCurrentSlot()?.status === AUTH_STATUS.PENDING
                        ? locale.Platform.Authorizing || "Authorizing..."
                        : locale.Platform.Authorize || "Authorize"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  </div>
);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locale.Title}
      icon={UserCog}
      iconColor="blue"
      children={content}
      themeClasses={themeClasses}
      width="max-w-5xl"
    />
  );
};

export default AuthorizationModal;