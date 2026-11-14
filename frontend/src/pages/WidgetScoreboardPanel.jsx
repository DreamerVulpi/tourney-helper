import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import {
  Paintbrush,
  Square,
  Play,
  Trophy,
  Loader2,
  Plus,
  Minus,
  Swords,
  ArrowLeftRight,
  Flag,
  ImageIcon,
  RotateCcw,
  Eye, EyeOff,
  Globe,
  User,
  Users,
  ImagePlus,
  Trash2,
  Pencil,
  Link2,
  Layers,
  Move,
  Boxes
} from "lucide-react";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";
import { Field } from "../components/ui/Field.jsx";
import { TabbedRange } from "../components/ui/TabbedRange.jsx";
import { ScoreOffsetPad } from "../components/ui/ScoreOffsetPad.jsx";
import { CompactStepper } from "../components/ui/CompactStepper.jsx";
import { ButtonFooter } from "../components/ui/ButtonFooter.jsx";
import { ActionButton } from "../components/ui/ActionButton.jsx";
import { useStartToggle } from "../hooks/WidgetScoreboardPanel/useStartToggle.jsx";
import { useGetListFlags } from "../hooks/WidgetScoreboardPanel/useGetListFlags.jsx";
import { useGetListScoreboardThemes } from "../hooks/WidgetScoreboardPanel/useGetListScoreboardThemes.jsx";
import { useGetListLogos } from "../hooks/WidgetScoreboardPanel/useGetListLogos.jsx";
import { useGetListPlanks } from "../hooks/WidgetScoreboardPanel/useGetListPlanks.jsx";
import { useGetListIcons } from "../hooks/WidgetScoreboardPanel/useGetListIcons.jsx";
import { useGetSystemFonts } from "../hooks/WidgetScoreboardPanel/useGetSystemFonts.jsx";
import AddLogoModal from "../components/modals/AddLogoModal.jsx";
import AddPlankModal from "../components/modals/AddPlankModal.jsx";
import AddIconModal from "../components/modals/AddIconModal.jsx";
import { ResetIconPicker, ResetIconPreview } from "../components/ui/ResetIconPicker.jsx";
import { ToggleSwitch } from "../components/ui/ToggleSwitch.jsx";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import PromptModal from "../components/modals/PromptModal.jsx";
import { ValidationModal } from "../components/ValidationModal.jsx";
import { DeleteIcon, DeleteLogo, DeletePlank, RenameIcon, RenameLogo, RenamePlank } from "../../wailsjs/go/application/App.js";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { getThemeClasses } from "../utils/themeClasses.jsx";
import { useThemeClasses } from "../hooks/App/useThemeClasses";
import { useAppStore } from "../store/useAppStore";
import { FORMAT_OPTIONS } from "../utils/formatMatches.js"
import { DEFAULT_SCOREBOARD_SIDE as DEFAULT_SIDE, defaultScoreboardSide as defaultSideFor } from "../utils/widgetDefaults.js";
import { TabbedSection } from "../components/ui/tabbedSection.jsx";

const clampScale = (s) => {
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return 1.0;
  return Math.max(0.5, Math.min(2.0, n));
};

const clampGap = (s) => {
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 480;
  return Math.max(100, Math.min(900, n));
};

const clampSideWidth = (s) => {
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 460;
  return Math.max(200, Math.min(1920, n));
};

const clampScoreFontSize = (s) => {
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return 28;
  return Math.max(16, Math.min(72, n));
};

const clampMainFontSize = (s) => {
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return 24;
  return Math.max(10, Math.min(72, n));
};

const clampResetIconScale = (s) => {
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0.5, Math.min(2.5, n));
};

const stripLogoExtension = (name) =>
  name ? String(name).replace(/\.[^.]+$/, "") : "";

const FORMAT_SELECT_OPTIONS = [
  { value: "", label: "—" },
  ...FORMAT_OPTIONS,
];

// Хелпер: частичный апдейт стороны P1/P2 + titleMatch через updateConfig
const patchScoreboard = (updateConfig, patch) =>
  updateConfig("widgets", { scoreboard: patch });

const WidgetScoreboardPlate = ({
  locale,
  updateConfig,
  selectWidgetSlot,
  renameWidgetSlot,
  resetWidgetSlot,
  isProcessing,
  setIsProcessingWS,
  isWidgetScoreboardRunning,
  setIsWidgetScoreboardRunning,
  iframeRef_WidgetScoreboard,
}) => {
  // ---- store ----
  const theme = useAppStore((s) => s.theme);
  const widgetServerBaseUrl = useAppStore((s) => s.widgetBaseUrl);
  const setStatusWidgetScoreboard = useAppStore(
    (s) => s.setStatusWidgetScoreboard,
  );
  const themeClasses = useThemeClasses(getThemeClasses);
  const widgets = useAppStore((s) => s.widgets);
  const scoreboard = widgets?.scoreboard;

  // ---- поля из конфига (единый источник истины) ----
  const themeScoreboard = scoreboard?.theme || "default";
  const titleMatch = scoreboard?.titleMatch ?? "CUSTOM NAME";
  const fontFamily = scoreboard?.fontFamily ?? "";
  const mainFontSize = scoreboard?.mainFontSize ?? 24;
  const hideLogos = scoreboard?.hideLogos ?? false;
  const hideFlags = scoreboard?.hideFlags ?? false;
  const scale = scoreboard?.scale ?? 1.0;
  const sideGap = scoreboard?.sideGap ?? 480;
  const sideWidth = scoreboard?.sideWidth ?? 460;
  const plateMode =
    scoreboard?.plateMode === "custom" ? "custom" : "builtin";
  const format = scoreboard?.format ?? "FT2";
  const p1 = scoreboard?.P1 ?? defaultSideFor("P1");
  const p2 = scoreboard?.P2 ?? defaultSideFor("P2");
  const activeScoreboardSlot = widgets?.activeScoreboardSlot ?? 0;
  const scoreboardSlotNames = widgets?.scoreboardSlotNames ?? [];
  const slotDisplayName = (index) => {
    const stored = String(scoreboardSlotNames[index] ?? "").trim();
    const fallback = `Slot ${index + 1}`;
    if (!stored || stored === fallback) {
      return `${locale.SlotLabel} ${index + 1}`;
    }
    return stored;
  };
  const scoreboardSlotItems = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        value: String(index),
        label: slotDisplayName(index),
      })),
    [scoreboardSlotNames, locale.SlotLabel],
  );

  const [activeTabP1, setActiveTabP1] = useState("logo");
  const [activeTabP2, setActiveTabP2] = useState("logo");

  useEffect(() => {
    if (plateMode === "custom") {
      setActiveTabP1("plank");
      setActiveTabP2("plank");
    } else {
      setActiveTabP1((tab) => (tab === "plank" ? "logo" : tab));
      setActiveTabP2((tab) => (tab === "plank" ? "logo" : tab));
    }
  }, [plateMode]);

  const themeOptions = useGetListScoreboardThemes();
  const flagOptions = useGetListFlags(locale.FlagNames);
  const { logos: logoOptions, reload: reloadLogos } = useGetListLogos();
  const { planks: plankOptions, reload: reloadPlanks } = useGetListPlanks();
  const { icons: iconOptions, reload: reloadIcons } = useGetListIcons();
  const systemFonts = useGetSystemFonts();
  const fontOptions = useMemo(
    () => [
      { value: "", label: locale.FontDefaultLabel },
      ...systemFonts.map((font) => ({ value: font, label: font })),
    ],
    [systemFonts, locale.FontDefaultLabel],
  );
  const readyScale = clampScale(scale);
  const readyGap = clampGap(sideGap);
  const readySideWidth = clampSideWidth(sideWidth);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [activeRangeTab, setActiveRangeTab] = useState("scale");
  const [addLogoModal, setAddLogoModal] = useState({ open: false, side: null });
  const [addPlankModal, setAddPlankModal] = useState({ open: false, side: null });
  const [addIconModal, setAddIconModal] = useState({ open: false, side: null });
  const [logoDelete, setLogoDelete] = useState({ open: false, name: null });
  const [logoRename, setLogoRename] = useState({ open: false, name: null });
  const [logoPending, setLogoPending] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [plankDelete, setPlankDelete] = useState({ open: false, name: null });
  const [plankRename, setPlankRename] = useState({ open: false, name: null });
  const [plankPending, setPlankPending] = useState(false);
  const [plankError, setPlankError] = useState("");
  const [iconDelete, setIconDelete] = useState({ open: false, name: null });
  const [iconRename, setIconRename] = useState({ open: false, name: null });
  const [iconPending, setIconPending] = useState(false);
  const [iconError, setIconError] = useState("");
  const [slotRename, setSlotRename] = useState({ open: false, index: null });
  const [slotReset, setSlotReset] = useState({ open: false, index: null });

  const handleWidgetScoreboardToggle = useStartToggle(
    isWidgetScoreboardRunning,
    setIsWidgetScoreboardRunning,
    isProcessing,
    setIsProcessingWS,
    setStatusWidgetScoreboard,
    widgets,
  );

  const scoreboardState = useMemo(() => ({
    theme: themeScoreboard,
    titleMatch,
    fontFamily,
    mainFontSize,
    hideLogos,
    hideFlags,
    scale: readyScale,
    sideGap: readyGap,
    sideWidth: readySideWidth,
    plateMode,
    format,
    P1: p1,
    P2: p2,
  }), [themeScoreboard, titleMatch, fontFamily, mainFontSize, hideLogos, hideFlags, readyScale, readyGap, readySideWidth, plateMode, format, p1, p2]);

  // ---------- Обработчики конфига ----------
  const handleThemeChange = useCallback(
    (value) => patchScoreboard(updateConfig, { theme: value }),
    [updateConfig],
  );
  const handleScaleChange = useCallback(
    (value) => patchScoreboard(updateConfig, { scale: clampScale(value) }),
    [updateConfig],
  );
  const handleSideGapChange = useCallback(
    (value) => patchScoreboard(updateConfig, { sideGap: clampGap(value) }),
    [updateConfig],
  );
  const handleSideWidthChange = useCallback(
    (value) => patchScoreboard(updateConfig, { sideWidth: clampSideWidth(value) }),
    [updateConfig],
  );
  const handlePlateModeChange = useCallback(
    (value) => patchScoreboard(updateConfig, { plateMode: value }),
    [updateConfig],
  );
  const handleTitleChange = useCallback(
    (value) => patchScoreboard(updateConfig, { titleMatch: value }),
    [updateConfig],
  );
  const handleFontFamilyChange = useCallback(
    (value) => patchScoreboard(updateConfig, { fontFamily: value }),
    [updateConfig],
  );
  const handleMainFontSizeChange = useCallback(
    (value) => patchScoreboard(updateConfig, { mainFontSize: clampMainFontSize(value) }),
    [updateConfig],
  );

  const handleFormatChange = useCallback(
    (value) => {
      const next = Array.isArray(value) ? (value[0] ?? "") : value;
      patchScoreboard(updateConfig, { format: next });
    },
    [updateConfig],
  );

    // Смена сторон (Swap)
  const handleSwitchSides = useCallback(() => {
    // Меняем стороны местами целиком
    patchScoreboard(updateConfig, {
      P1: { ...p2 },
      P2: { ...p1 },
    });
  }, [updateConfig, p1, p2]);

  // Сброс счета (Reset)
  const handleResetScore = useCallback(() => {
    patchScoreboard(updateConfig, {
      P1: { ...p1, points: 0 },
      P2: { ...p2, points: 0 },
    });
  }, [updateConfig, p1, p2]);

  // Обновление стороны
  const updateSide = useCallback(
    (side, patch) => {
      const current = scoreboard?.[side] ?? defaultSideFor(side);
      // Отправляем ПОЛНЫЙ объект стороны, чтобы ничего не затиралось
      patchScoreboard(updateConfig, { 
        [side]: { ...current, ...patch } 
      });
    },
    [updateConfig, scoreboard],
  );

  // Переключение видимости (Глазик)
  const handleToggleVisibility = useCallback(
    (side, field) => {
      const current = scoreboard?.[side]?.[field] ?? (field === "showReset" ? false : true);
      updateSide(side, { [field]: !current });
    },
    [scoreboard, updateSide]
  );

  // Изменение счета
  const handleScoreChange = useCallback(
    (side, delta) => {
      const current = scoreboard?.[side]?.points ?? 0;
      updateSide(side, { points: Math.max(0, current + delta) });
    },
    [scoreboard, updateSide],
  );

  const handleDeleteLogo = useCallback(async () => {
    const name = logoDelete.name;
    if (!name) return;

    setLogoPending(true);
    try {
      await DeleteLogo(name);

      const patch = {};
      if (scoreboard?.P1?.logoPath === name) {
        patch.P1 = { ...scoreboard.P1, logoPath: "" };
      }
      if (scoreboard?.P2?.logoPath === name) {
        patch.P2 = { ...scoreboard.P2, logoPath: "" };
      }
      if (Object.keys(patch).length) {
        patchScoreboard(updateConfig, patch);
      }

      await reloadLogos();
      setLogoDelete({ open: false, name: null });
    } catch (err) {
      setLogoError(String(err?.message ?? err));
    } finally {
      setLogoPending(false);
    }
  }, [logoDelete.name, scoreboard, updateConfig, reloadLogos]);

  const handleRenameLogo = useCallback(async (oldName, newName) => {
    if (!oldName || !newName?.trim()) return;

    setLogoPending(true);
    try {
      const info = await RenameLogo(oldName, newName.trim());

      const patch = {};
      if (scoreboard?.P1?.logoPath === oldName) {
        patch.P1 = { ...scoreboard.P1, logoPath: info.name };
      }
      if (scoreboard?.P2?.logoPath === oldName) {
        patch.P2 = { ...scoreboard.P2, logoPath: info.name };
      }
      if (Object.keys(patch).length) {
        patchScoreboard(updateConfig, patch);
      }

      await reloadLogos();
      setLogoRename({ open: false, name: null });
    } catch (err) {
      setLogoError(String(err?.message ?? err));
    } finally {
      setLogoPending(false);
    }
  }, [scoreboard, updateConfig, reloadLogos]);

  const handleDeletePlank = useCallback(async () => {
    const name = plankDelete.name;
    if (!name) return;

    setPlankPending(true);
    try {
      await DeletePlank(name);

      const patch = {};
      if (scoreboard?.P1?.plateImage === name) {
        patch.P1 = { ...scoreboard.P1, plateImage: "" };
      }
      if (scoreboard?.P2?.plateImage === name) {
        patch.P2 = { ...scoreboard.P2, plateImage: "" };
      }
      if (Object.keys(patch).length) {
        patchScoreboard(updateConfig, patch);
      }

      await reloadPlanks();
      setPlankDelete({ open: false, name: null });
    } catch (err) {
      setPlankError(String(err?.message ?? err));
    } finally {
      setPlankPending(false);
    }
  }, [plankDelete.name, scoreboard, updateConfig, reloadPlanks]);

  const handleRenamePlank = useCallback(async (oldName, newName) => {
    if (!oldName || !newName?.trim()) return;

    setPlankPending(true);
    try {
      const info = await RenamePlank(oldName, newName.trim());

      const patch = {};
      if (scoreboard?.P1?.plateImage === oldName) {
        patch.P1 = { ...scoreboard.P1, plateImage: info.name };
      }
      if (scoreboard?.P2?.plateImage === oldName) {
        patch.P2 = { ...scoreboard.P2, plateImage: info.name };
      }
      if (Object.keys(patch).length) {
        patchScoreboard(updateConfig, patch);
      }

      await reloadPlanks();
      setPlankRename({ open: false, name: null });
    } catch (err) {
      setPlankError(String(err?.message ?? err));
    } finally {
      setPlankPending(false);
    }
  }, [scoreboard, updateConfig, reloadPlanks]);

  const handleDeleteIcon = useCallback(async () => {
    const name = iconDelete.name;
    if (!name) return;

    setIconPending(true);
    try {
      await DeleteIcon(name);

      const patch = {};
      if (scoreboard?.P1?.resetIcon === name) {
        patch.P1 = { ...scoreboard.P1, resetIcon: "", resetIconData: "" };
      }
      if (scoreboard?.P2?.resetIcon === name) {
        patch.P2 = { ...scoreboard.P2, resetIcon: "", resetIconData: "" };
      }
      if (Object.keys(patch).length) {
        patchScoreboard(updateConfig, patch);
      }

      await reloadIcons();
      setIconDelete({ open: false, name: null });
    } catch (err) {
      setIconError(String(err?.message ?? err));
    } finally {
      setIconPending(false);
    }
  }, [iconDelete.name, scoreboard, updateConfig, reloadIcons]);

  const handleRenameIcon = useCallback(async (oldName, newName) => {
    if (!oldName || !newName?.trim()) return;

    setIconPending(true);
    try {
      const info = await RenameIcon(oldName, newName.trim());

      const patch = {};
      if (scoreboard?.P1?.resetIcon === oldName) {
        patch.P1 = {
          ...scoreboard.P1,
          resetIcon: info.name,
          resetIconData: "",
        };
      }
      if (scoreboard?.P2?.resetIcon === oldName) {
        patch.P2 = {
          ...scoreboard.P2,
          resetIcon: info.name,
          resetIconData: "",
        };
      }
      if (Object.keys(patch).length) {
        patchScoreboard(updateConfig, patch);
      }

      await reloadIcons();
      setIconRename({ open: false, name: null });
    } catch (err) {
      setIconError(String(err?.message ?? err));
    } finally {
      setIconPending(false);
    }
  }, [scoreboard, updateConfig, reloadIcons]);

  const handleRenameSlot = useCallback(
    (newName) => {
      if (slotRename.index === null) return;
      renameWidgetSlot?.("scoreboard", slotRename.index, newName);
      setSlotRename({ open: false, index: null });
    },
    [slotRename.index, renameWidgetSlot],
  );

  const handleResetSlot = useCallback(() => {
    if (slotReset.index === null) return;
    resetWidgetSlot?.(
      "scoreboard",
      slotReset.index,
      `${locale.SlotLabel} ${slotReset.index + 1}`,
    );
    setSlotReset({ open: false, index: null });
  }, [slotReset.index, resetWidgetSlot, locale.SlotLabel]);

  // ---------- URL ----------
  const widgetBaseUrl = `${widgetServerBaseUrl}/widgets/scoreboard`;
  const baseIframeUrl = `${widgetBaseUrl}?preview=1`;

  const scoreboardUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("theme", themeScoreboard);
    if (hideLogos) params.set("hideLogos", "1");
    if (hideFlags) params.set("hideFlags", "1");
    if (readyScale !== 1.0) params.set("scale", String(readyScale));
    return `${widgetBaseUrl}?${params.toString()}`;
  }, [themeScoreboard, hideLogos, hideFlags, readyScale]);

  // В iframe всегда показываем уменьшенную демонстрацию 0.55x.
  // Ползунок масштаба влияет только на внешние браузеры.
  const iframeState = useMemo(
    () => ({ ...scoreboardState, scale: 0.55 }),
    [scoreboardState],
  );

  // ---------- Фиксируем src при старте ----------
  // Смена любых параметров не перезагружает iframe:
  // они применяются в реальном времени через postMessage.
  const initialSrcRef = useRef(null);
  useEffect(() => {
    if (!isWidgetScoreboardRunning) {
      initialSrcRef.current = null;
      setIframeLoaded(false);
      return;
    }

    initialSrcRef.current = baseIframeUrl;
    setIframeLoaded(false);
  }, [isWidgetScoreboardRunning]);

  // ---------- postMessage полного состояния в iframe ----------
  useEffect(() => {
    if (!isWidgetScoreboardRunning) return;
    const iframe = iframeRef_WidgetScoreboard?.current;
    if (!iframe) return;

    const sendState = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "scoreboard:state-changed",
          state: iframeState,
        },
        "*",
      );
    };

    sendState();
    iframe.addEventListener("load", sendState);

    const syncTimer = setTimeout(() => {
      fetch(`${widgetBaseUrl}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scoreboardState),
      }).catch((err) => {
        console.warn("[scoreboard] state sync failed:", err);
      });
    }, 150);

    return () => {
      iframe.removeEventListener("load", sendState);
      clearTimeout(syncTimer);
    };
  }, [
    isWidgetScoreboardRunning,
    iframeRef_WidgetScoreboard,
    scoreboardState,
    iframeState,
    widgetBaseUrl,
  ]);

  const isStartDisabled = isProcessing || isWidgetScoreboardRunning;
  const isStopDisabled = isProcessing;
  const getButtonStyle = getLaunchButtonStyle(isWidgetScoreboardRunning, false);

  const EXTRA_TABS = [
    { id: "logo", icon: ImageIcon, label: locale.LogoLabel },
    { id: "flag", icon: Flag,      label: locale.FlagsLabel },
    ...(plateMode === "custom"
      ? [{ id: "plank", icon: ImageIcon, label: locale.PlankLabel }]
      : []),
    { id: "reset", icon: RotateCcw, label: locale.ResetTab },
    { id: "score", icon: Move, label: locale.ScoreTab },
  ];

  const renderSideControls = (side, activeTab, setActiveTab) => {
  const data = scoreboard?.[side] ?? defaultSideFor(side);
  const selectedFlag = flagOptions.find((f) => f.value === data.flag);
  const selectedLogo = logoOptions.find((l) => l.value === data.logoPath);
  const logoPreview =
    selectedLogo?.dataUrl ||
    (/^(https?:|data:|blob:)/i.test(data.logoPath || "") ? data.logoPath : "");
  const isP2 = side === "P2";

  // Блок с тегом команды
  const teamNameField = (
    <div key="teamTag" className="w-28 flex-shrink-0">
      <Field
        icon={Users}
        variant="input"
        label={locale.TeamNameLabel}
        value={data.teamTag ?? ""}
        onChange={(val) => updateSide(side, { teamTag: val })}
        themeClasses={themeClasses}
        placeholder={locale.TeamTagPlaceholder}
      />
    </div>
  );

  // Блок с именем
  const nameField = (
    <div key="name" className={`flex-1 min-w-0 ${isP2 ? "pl-4" : "pr-4"}`}>
      <Field
        icon={User}
        variant="input"
        label={side}
        value={data.name}
        onChange={(val) => updateSide(side, { name: val })}
        themeClasses={themeClasses}
        placeholder={locale.PlayerNamePlaceholder}
      />
    </div>
  );

  // Блок с кнопками +/- (они всегда идут перед счетом)
  // translate-y компенсирует высоту label у Team Name / P1-P2,
  // чтобы центры полей совпали с линией между + и -.
  const buttonsBlock = (
    <div
      key="btns"
      className="flex flex-col items-center gap-1 translate-y-[11px]"
    >
      <button
        onClick={() => handleScoreChange(side, 1)}
        className="w-7 h-7 flex items-center justify-center bg-green-600/10 text-green-500 rounded-lg border border-green-600/20 hover:bg-green-600/20 transition-colors"
      >
        <Plus size={14} />
      </button>
      <button
        onClick={() => handleScoreChange(side, -1)}
        className="w-7 h-7 flex items-center justify-center bg-red-600/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
      >
        <Minus size={14} />
      </button>
    </div>
  );

  // Блок со счетом
  const scoreBlock = (
    <span
      key="pts"
      className="text-xl font-bold tabular-nums w-6 text-center translate-y-[11px]"
    >
      {data.points}
    </span>
  );

  // Формируем строку в зависимости от стороны
  // P1: [Тег] [Имя] --- [Кнопки] [Счет]
  // P2: [Счет] [Кнопки] --- [Имя] [Тег]
  const topRow = isP2
    ? [scoreBlock, buttonsBlock, nameField, teamNameField]
    : [teamNameField, nameField, buttonsBlock, scoreBlock];

    return (
      <div
        className={`flex flex-col min-w-0 p-3 rounded-xl border gap-6 ${
          themeClasses?.tempSection || "bg-slate-800 border-slate-700"
        }`}
      >
        {/* Верхняя строка */}
        <div className="flex items-center justify-between gap-1 -mt-1.5">
          {topRow}
        </div>

        {/* Табы */}
        <TabbedSection
          tabs={EXTRA_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          themeClasses={themeClasses}
          className="flex-1 min-h-0"
          padding="p-3"
          rounding = "rounded-[1rem]"
        >
          {(tab) =>
            tab === "logo" ? (
              <div className="flex gap-2 items-start pt-2">
                {/* Квадрат логотипа */}
                <div className="relative w-18 h-18 flex-shrink-0">
                  <div
                    className={`w-full h-full rounded-lg border flex items-center justify-center overflow-hidden ${
                      themeClasses?.field || "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt={data.logoPath}
                        className={`w-full h-full object-contain ${
                          data.showLogo !== false ? "" : "opacity-30 grayscale"
                        }`}
                      />
                    ) : (
                      <ImageIcon
                        className={data.showLogo !== false ? "text-slate-500 opacity-50" : "text-slate-700 opacity-30"}
                        size={24}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(side, "showLogo")}
                    className={`absolute -bottom-1 -right-1 p-1 rounded-md border shadow-sm transition-colors z-10 ${
                      data.showLogo !== false
                        ? "bg-slate-700 border-slate-600 text-green-400 hover:bg-slate-600"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
                    }`}
                    title={data.showLogo !== false ? locale.HideLogoTitle : locale.ShowLogoTitle}
                  >
                    {data.showLogo !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                </div>

                {/* Инпуты */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {logoOptions.length > 0 ? (
                    <Field
                      variant="multiselect"
                      single
                      searchable
                      label={locale.LogoLabel}
                      value={data.logoPath ? [data.logoPath] : []}
                      onChange={(values) =>
                        updateSide(side, { logoPath: values?.[0] ?? "" })
                      }
                      items={logoOptions}
                      locale={locale}
                      themeClasses={themeClasses}
                      height="1.9rem"
                      placeholder={locale.LogoPlaceholder}
                      maxVisible={5}
                      renderItem={(item) => (
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          {item.dataUrl && (
                            <img
                              src={item.dataUrl}
                              alt=""
                              className="w-6 h-6 object-contain rounded-sm shrink-0"
                            />
                          )}
                          <span className="truncate flex-1 min-w-0">
                            {item.label}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            title={locale.RenameLogoTitle}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoRename({ open: true, name: item.value });
                            }}
                            className="shrink-0 p-1 rounded hover:bg-white/10 cursor-pointer"
                          >
                            <Pencil size={12} />
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            title={locale.DeleteLogoTitle}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoDelete({ open: true, name: item.value });
                            }}
                            className="shrink-0 p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </span>
                        </span>
                      )}
                    />
                  ) : (
                    <Field
                      icon={Globe}
                      variant="input"
                      value={data.logoPath}
                      onChange={(val) => updateSide(side, { logoPath: val })}
                      themeClasses={themeClasses}
                      placeholder={locale.LogoPathPlaceholder}
                      height="2rem"
                    />
                  )}
                  <Field
                    variant="button"
                    icon={ImagePlus}
                    labelButton={locale.AddLogoButton}
                    height="2.1rem"
                    themeClasses={themeClasses}
                    onClick={() =>
                      setAddLogoModal({ open: true, side })
                    }
                  />
                </div>
              </div>
            ) : tab === "flag" ? (
              <div className="flex gap-2 items-start pt-2 min-w-0">
                {/* Прямоугольник флага */}
                <div className="relative w-26 h-17 flex-shrink-0">
                  <div
                    className={`w-full h-full rounded-lg border flex items-center justify-center overflow-hidden ${
                      themeClasses?.field || "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {selectedFlag?.dataUrl ? (
                      <img
                        src={selectedFlag.dataUrl}
                        alt={selectedFlag.label}
                        className={`w-full h-full object-contain ${
                          data.showFlag !== false ? "" : "opacity-30 grayscale"
                        }`}
                      />
                    ) : (
                      <Flag
                        className={data.showFlag !== false ? "text-slate-500 opacity-50" : "text-slate-700 opacity-30"}
                        size={24}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(side, "showFlag")}
                    className={`absolute -bottom-1 -right-1 p-1 rounded-md border shadow-sm transition-colors z-10 ${
                      data.showFlag !== false
                        ? "bg-slate-700 border-slate-600 text-green-400 hover:bg-slate-600"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
                    }`}
                    title={data.showFlag !== false ? locale.HideFlagTitle : locale.ShowFlagTitle}
                  >
                    {data.showFlag !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Field
                    variant="multiselect"
                    single
                    searchable
                    label={locale.FlagsLabel}
                    value={data.flag ? [data.flag] : []}
                    onChange={(values) => updateSide(side, { flag: values?.[0] ?? "" })}
                    items={flagOptions}
                    locale={locale}
                    themeClasses={themeClasses}
                    height="1.9rem"
                    placeholder={locale.FlagPlaceholder}
                    maxVisible={5}
                    renderItem={(item) => (
                      <span className="flex items-center gap-2 min-w-0">
                        {item.dataUrl && (
                          <img
                            src={item.dataUrl}
                            alt=""
                            className="w-6 h-4 object-contain rounded-sm shrink-0"
                          />
                        )}
                        <span className="truncate">{item.shortLabel ?? item.label}</span>
                      </span>
                    )}
                  />
                </div>
              </div>
            ) : tab === "plank" ? (
              <div className="flex flex-col gap-2 pt-2 min-w-0">
                {plankOptions.length > 0 && (
                  <Field
                    variant="multiselect"
                    single
                    searchable
                    label={locale.PlankLabel}
                    value={data.plateImage ? [data.plateImage] : []}
                    onChange={(values) =>
                      updateSide(side, { plateImage: values?.[0] ?? "" })
                    }
                    items={plankOptions}
                    locale={locale}
                    themeClasses={themeClasses}
                    height="1.9rem"
                    placeholder={locale.PlankPlaceholder}
                    maxVisible={5}
                    renderItem={(item) => (
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        {item.dataUrl && (
                          <img
                            src={item.dataUrl}
                            alt=""
                            className="w-7 h-4 object-contain rounded-sm shrink-0"
                          />
                        )}
                        <span className="truncate flex-1 min-w-0">
                          {item.label}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          title={locale.RenamePlankTitle}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlankRename({ open: true, name: item.value });
                          }}
                          className="shrink-0 p-1 rounded hover:bg-white/10 cursor-pointer"
                        >
                          <Pencil size={12} />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          title={locale.DeletePlankTitle}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlankDelete({ open: true, name: item.value });
                          }}
                          className="shrink-0 p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </span>
                      </span>
                    )}
                  />
                )}

                <Field
                  variant="button"
                  icon={ImagePlus}
                  labelButton={locale.AddPlankButton}
                  height="2.1rem"
                  themeClasses={themeClasses}
                  onClick={() => setAddPlankModal({ open: true, side })}
                />
              </div>
            ) : tab === "reset" ? (
              <div className="flex gap-2 items-start pt-2">
                <div className="relative w-18 h-18 flex-shrink-0">
                  <div
                    className={`w-full h-full rounded-lg border flex items-center justify-center overflow-hidden ${
                      data.showReset === true ? "" : "opacity-30"
                    } ${themeClasses?.field || "bg-slate-900 border-slate-700"}`}
                  >
                    <ResetIconPreview
                      value={data.resetIcon ?? ""}
                      iconData={data.resetIconData ?? ""}
                      customIcons={iconOptions}
                      size={30}
                    />
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(side, "showReset")}
                    className={`absolute -bottom-1 -right-1 p-1 rounded-md border shadow-sm transition-colors z-10 ${
                      data.showReset === true
                        ? "bg-slate-700 border-slate-600 text-green-400 hover:bg-slate-600"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
                    }`}
                    title={
                      data.showReset === true
                        ? locale.HideResetTitle
                        : locale.ShowResetTitle
                    }
                  >
                    {data.showReset === true ? (
                      <Eye size={12} />
                    ) : (
                      <EyeOff size={12} />
                    )}
                  </button>
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <ResetIconPicker
                    value={data.resetIcon ?? ""}
                    iconData={data.resetIconData ?? ""}
                    customIcons={iconOptions}
                    onChange={({ icon, iconData }) =>
                      updateSide(side, {
                        resetIcon: icon,
                        resetIconData: iconData,
                      })
                    }
                    onRenameCustom={(item) =>
                      setIconRename({ open: true, name: item.value })
                    }
                    onDeleteCustom={(item) =>
                      setIconDelete({ open: true, name: item.value })
                    }
                    locale={locale}
                    themeClasses={themeClasses}
                  />

                  <div className="flex flex-row items-end gap-2 w-full">
                    <div className="flex flex-col gap-1 shrink-0">
                      <span
                        className={`text-center text-[10px] font-black uppercase italic px-1 ${themeClasses.label}`}
                      >
                        {locale.ResetIconScaleLabel}
                      </span>
                      <CompactStepper
                        value={clampResetIconScale(data.resetIconScale ?? 1)}
                        min={0.5}
                        max={2.5}
                        step={0.05}
                        onChange={(value) =>
                          updateSide(side, {
                            resetIconScale: clampResetIconScale(value),
                          })
                        }
                        formatValue={(value) => `${Number(value).toFixed(2)}×`}
                        resetValue={1}
                        resetLabel={locale.ScoreOffsetReset}
                        themeClasses={themeClasses}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Field
                        variant="button"
                        icon={ImagePlus}
                        labelButton={locale.AddButton}
                        height="2.1rem"
                        themeClasses={themeClasses}
                        onClick={() => setAddIconModal({ open: true, side })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : tab === "score" ? (
              <div className="flex flex-col gap-2 pt-2 w-full">
                <div className="flex flex-row items-start gap-3 w-full">
                  <div className="flex-shrink-0">
                    <ScoreOffsetPad
                      x={data.scoreOffsetX ?? 0}
                      y={data.scoreOffsetY ?? 0}
                      max={50}
                      themeClasses={themeClasses}
                      resetLabel={locale.ScoreOffsetReset}
                      onChange={(x, y) =>
                        updateSide(side, {
                          scoreOffsetX: x,
                          scoreOffsetY: y,
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <Field
                      variant="combobox"
                      label={locale.FontLabel}
                      labelClassName="text-center"
                      value={fontFamily}
                      onChange={handleFontFamilyChange}
                      items={fontOptions}
                      themeClasses={themeClasses}
                      height="1.9rem"
                    />

                    <div className="flex flex-row items-start gap-2 w-full">
                      <div className="flex flex-col gap-1 items-center flex-1 min-w-0">
                        <span
                          className={`text-[10px] font-black uppercase italic text-center ${themeClasses.label}`}
                        >
                          {locale.MainFontSizeLabel}
                        </span>
                        <CompactStepper
                          value={clampMainFontSize(mainFontSize)}
                          min={10}
                          max={72}
                          step={1}
                          onChange={handleMainFontSizeChange}
                          formatValue={(value) => `${Math.round(value)}px`}
                          resetValue={24}
                          resetLabel={locale.ScoreOffsetReset}
                          themeClasses={themeClasses}
                        />
                      </div>

                      <div className="flex flex-col gap-1 items-center flex-1 min-w-0">
                        <span
                          className={`text-[10px] font-black uppercase italic text-center ${themeClasses.label}`}
                        >
                          {locale.ScoreFontSizeLabel}
                        </span>
                        <CompactStepper
                          value={clampScoreFontSize(data.scoreFontSize ?? 28)}
                          min={16}
                          max={72}
                          step={1}
                          onChange={(value) =>
                            updateSide(side, {
                              scoreFontSize: clampScoreFontSize(value),
                            })
                          }
                          formatValue={(value) => `${Math.round(value)}px`}
                          resetValue={28}
                          resetLabel={locale.ScoreOffsetReset}
                          themeClasses={themeClasses}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          }
        </TabbedSection>
      </div>
    );
  };

  const rangeTabs = [
    {
      id: "scale",
      label: locale.ScaleTab,
      min: 0.5,
      max: 2.0,
      step: 0.05,
      value: readyScale,
      onChange: handleScaleChange,
      resetValue: 1.0,
      formatValue: (value) => `${parseFloat(value).toFixed(2)}×`,
      rangeMinIcon: Minus,
      rangeMaxIcon: Plus,
    },
    {
      id: "gap",
      label: locale.GapTab,
      min: 100,
      max: 900,
      step: 10,
      value: readyGap,
      onChange: handleSideGapChange,
      resetValue: 480,
      formatValue: (value) => `${Math.round(parseFloat(value))}px`,
      rangeMinIcon: Minus,
      rangeMaxIcon: Plus,
    },
    {
      id: "sideWidth",
      label: locale.PlateWidthTab,
      min: 200,
      max: 1920,
      step: 10,
      value: readySideWidth,
      onChange: handleSideWidthChange,
      resetValue: 460,
      formatValue: (value) => `${Math.round(parseFloat(value))}px`,
      rangeMinIcon: Minus,
      rangeMaxIcon: Plus,
    },
  ];

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="flex flex-col gap-4 flex-1 min-h-0 w-full">
        <div className="col-span-16 min-h-0 flex flex-col gap-4 h-full">
          
          {/* Превью (Iframe) */}
          <div
            className={`relative w-full h-38 shrink-0 rounded-[0.5rem] ${themeClasses.button}`}
          >
            {!isWidgetScoreboardRunning && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 w-80">
                <EmptyState
                  icon={Swords}
                  title={locale.WidgetNotRunning}
                  description={locale.ClickStartDescription}
                />
              </div>
            )}

            {isWidgetScoreboardRunning && scoreboardUrl && (
              <>
                <iframe
                  src={initialSrcRef.current || baseIframeUrl}
                  ref={iframeRef_WidgetScoreboard}
                  className="absolute inset-0 w-full h-full border-0 rounded-[0.5rem]"
                  title="Scoreboard"
                  allowtransparency="true"
                  onLoad={() => setIframeLoaded(true)}
                  style={{ background: "transparent" }}
                />

                <div className="absolute bottom-4 left-3 z-10 w-72">
                  <Field
                    variant="copy"
                    icon={Link2}
                    value={scoreboardUrl}
                    height="2rem"
                    themeClasses={themeClasses}
                  />
                </div>

                <div className="absolute bottom-4 right-4 z-10 w-80">
                  <TabbedRange
                    tabs={rangeTabs}
                    activeTab={activeRangeTab}
                    onChangeTab={setActiveRangeTab}
                    themeClasses={themeClasses}
                  />
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-72">
                  <ToggleSwitch
                    label={locale.PlateModeLabel}
                    value={plateMode}
                    options={[
                      {
                        value: "builtin",
                        label: locale.BuiltInMode,
                        icon: Layers,
                      },
                      {
                        value: "custom",
                        label: locale.CustomMode,
                        icon: ImageIcon,
                      },
                    ]}
                    color="amber"
                    compact
                    themeClasses={themeClasses}
                    onChange={handlePlateModeChange}
                  />
                </div>
              </>
            )}

            {!iframeLoaded && isWidgetScoreboardRunning && scoreboardUrl && (
              <div className="absolute inset-0 flex items-center rounded-[0.5rem] justify-center z-20 bg-slate-900/80 backdrop-blur-sm">
                <EmptyState
                  icon={Loader2}
                  title={locale.LoadScoreboard}
                  description={locale.FetchData}
                />
              </div>
            )}

          </div>

          {/* Игроки: P1 — центр — P2 */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-start shrink-0 flex-1 min-w-0">
            {/* Левая сторона (P1) */}
            {renderSideControls("P1", activeTabP1, setActiveTabP1)}

            {/* Центр (Настройки матча) */}
            <div className="flex flex-col gap-2 items-center w-[17rem]">
              {/* Слот виджета */}
              <div className="w-full">
                <Field
                  variant="multiselect"
                  single
                  label={locale.SlotLabel}
                  icon={Boxes}
                  value={[String(activeScoreboardSlot)]}
                  onChange={(values) =>
                    selectWidgetSlot?.(
                      "scoreboard",
                      Number(values?.[0] ?? 0),
                    )
                  }
                  items={scoreboardSlotItems}
                  locale={locale}
                  themeClasses={themeClasses}
                  height="1.9rem"
                  maxVisible={5}
                  renderItem={(item) => (
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="truncate flex-1 min-w-0">
                        {item.label}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        title={locale.RenameSlotTitle}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlotRename({
                            open: true,
                            index: Number(item.value),
                          });
                        }}
                        className="shrink-0 p-1 rounded hover:bg-white/10 cursor-pointer"
                      >
                        <Pencil size={12} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        title={locale.ResetSlotTitle}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlotReset({
                            open: true,
                            index: Number(item.value),
                          });
                        }}
                        className="shrink-0 p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        <RotateCcw size={12} />
                      </span>
                    </span>
                  )}
                />
              </div>

              {/* Title Event + кнопки со стрелками */}
              <div className="w-full flex flex-row gap-1 items-end">
                <div className="flex-1 min-w-0">
                  <Field
                    variant="input"
                    label={locale.TitleEventLabel}
                    value={titleMatch}
                    onChange={handleTitleChange}
                    themeClasses={themeClasses}
                    icon={Trophy}
                    placeholder={locale.TitleEventPlaceholder}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSwitchSides}
                  style={{ height: "1.9rem" }}
                  className={`w-9 shrink-0 flex items-center justify-center rounded-xl border text-xs font-black uppercase italic ${themeClasses.button}`}
                  title={locale.SwitchSidesTitle}
                >
                  <ArrowLeftRight size={16} className="text-blue-500" />
                </button>
                <button
                  type="button"
                  onClick={handleResetScore}
                  style={{ height: "1.9rem" }}
                  className={`w-9 shrink-0 flex items-center justify-center rounded-xl border text-xs font-black uppercase italic ${themeClasses.button}`}
                  title={locale.ResetScoreTitle}
                >
                  <RotateCcw size={16} className="text-blue-500" />
                </button>
              </div>

              {/* Format + Theme */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex flex-row gap-1 w-full mt-1 items-start">
                  <div className="flex-1 min-w-0">
                    <Field
                      variant="multiselect"
                      single
                      searchable
                      icon={Swords}
                      label={locale.Format}
                      value={[format]}
                      onChange={handleFormatChange}
                      items={FORMAT_SELECT_OPTIONS}
                      locale={locale}
                      themeClasses={themeClasses}
                      height="1.9rem"
                      placeholder={locale.FormatPlaceholder}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Field
                      variant="select"
                      label={locale.ListOfThemes}
                      icon={Paintbrush}
                      onChange={handleThemeChange}
                      value={themeScoreboard}
                      themeClasses={themeClasses}
                      items={themeOptions}
                    />
                  </div>
                </div>
                
              </div>

              {/* Start / Stop Кнопка */}
              <div className="w-full mt-2 flex justify-center">
                <ActionButton
                  icon={isWidgetScoreboardRunning ? Square : Play}
                  loading={isProcessing}
                  disabled={
                    isWidgetScoreboardRunning ? isStopDisabled : isStartDisabled
                  }
                  expandOnHover={isWidgetScoreboardRunning && !isProcessing}
                  className={`${getButtonStyle} ${
                    isWidgetScoreboardRunning ? "" : "w-full"
                  }`}
                  iconClassName="fill-white"
                  onClick={handleWidgetScoreboardToggle}
                >
                  {isWidgetScoreboardRunning ? locale.Stop : locale.Start}
                </ActionButton>
              </div>

            </div>

            {/* Правая сторона (P2) */}
            {renderSideControls("P2", activeTabP2, setActiveTabP2)}
          </div>
          
        </div>
      </div>

      <AddLogoModal
        isOpen={addLogoModal.open}
        onClose={() => setAddLogoModal({ open: false, side: null })}
        onAdded={async (info) => {
          if (addLogoModal.side && info?.name) {
            updateSide(addLogoModal.side, { logoPath: info.name });
          }
          await reloadLogos();
        }}
        themeClasses={themeClasses}
        locale={locale}
      />

      <AddPlankModal
        isOpen={addPlankModal.open}
        onClose={() => setAddPlankModal({ open: false, side: null })}
        onAdded={async (info) => {
          if (addPlankModal.side && info?.name) {
            updateSide(addPlankModal.side, { plateImage: info.name });
          }
          await reloadPlanks();
        }}
        themeClasses={themeClasses}
        locale={locale}
        recommendedWidth={Math.round(readySideWidth)}
        recommendedHeight={64}
      />

      <AddIconModal
        isOpen={addIconModal.open}
        onClose={() => setAddIconModal({ open: false, side: null })}
        onAdded={async (info) => {
          if (addIconModal.side && info?.name) {
            updateSide(addIconModal.side, {
              resetIcon: info.name,
              resetIconData: "",
            });
          }
          await reloadIcons();
        }}
        themeClasses={themeClasses}
        locale={locale}
      />

      <PromptModal
        isOpen={slotRename.open}
        onClose={() => setSlotRename({ open: false, index: null })}
        onConfirm={handleRenameSlot}
        title={locale.RenameSlotModalTitle}
        label={locale.SlotNameLabel}
        defaultValue={
          slotRename.index === null ? "" : slotDisplayName(slotRename.index)
        }
        confirmLabel={locale.SaveButton}
        validate={(value) =>
          value.trim() ? null : locale.NameCannotBeEmpty
        }
        resetValue={
          slotRename.index === null
            ? undefined
            : `${locale.SlotLabel} ${slotRename.index + 1}`
        }
        resetLabel={locale.ResetSlotNameButton}
        icon={Pencil}
        iconColor="amber"
        theme={theme}
        themeClasses={themeClasses}
      />

      <ConfirmModal
        isOpen={slotReset.open}
        onClose={() => setSlotReset({ open: false, index: null })}
        onConfirm={handleResetSlot}
        title={locale.ResetSlotModalTitle}
        message={
          (() => {
            const parts = locale.ResetSlotModalMessage.split("%v");
            const index = slotReset.index ?? 0;
            const name = slotDisplayName(index);
            return (
              <>
                {parts[0]}
                <span className="text-red-500 font-black italic">{name}</span>
                {parts[1]}
              </>
            );
          })()
        }
        confirmLabel={locale.ResetSlotConfirmButton}
        icon={RotateCcw}
        iconColor="red"
        iconColorClass="text-red-500"
        danger
        theme={theme}
        themeClasses={themeClasses}
      />

      <ConfirmModal
        isOpen={iconDelete.open}
        onClose={() => setIconDelete({ open: false, name: null })}
        onConfirm={handleDeleteIcon}
        loading={iconPending}
        title={locale.DeleteIconModalTitle}
        message={
          (() => {
            const parts = locale.DeleteIconModalMessage.split("%v");
            return (
              <>
                {parts[0]}
                <span className="text-red-500 font-black italic">
                  {iconDelete.name}
                </span>
                {parts[1]}
              </>
            );
          })()
        }
        confirmLabel={locale.DeleteIconConfirmButton}
        icon={Trash2}
        iconColor="red"
        iconColorClass="text-red-500"
        danger
        theme={theme}
        themeClasses={themeClasses}
      />

      <PromptModal
        isOpen={iconRename.open}
        onClose={() => setIconRename({ open: false, name: null })}
        onConfirm={(newName) => handleRenameIcon(iconRename.name, newName)}
        loading={iconPending}
        title={locale.RenameIconModalTitle}
        label={locale.FileNameLabel}
        defaultValue={stripLogoExtension(iconRename.name)}
        confirmLabel={locale.SaveButton}
        validate={(value) =>
          value.trim() ? null : locale.NameCannotBeEmpty
        }
        icon={Pencil}
        iconColor="amber"
        theme={theme}
        themeClasses={themeClasses}
      />

      <ValidationModal
        isOpen={!!iconError}
        onClose={() => setIconError("")}
        message={iconError}
        locale={{ ErrorFillParams: locale.ErrorTitle, OkButtonLabel: locale.OkButtonLabel }}
        themeClasses={themeClasses}
      />

      <ConfirmModal
        isOpen={logoDelete.open}
        onClose={() => setLogoDelete({ open: false, name: null })}
        onConfirm={handleDeleteLogo}
        loading={logoPending}
        title={locale.DeleteLogoModalTitle}
        message={
          (() => {
            const parts = locale.DeleteLogoModalMessage.split("%v");
            return (
              <>
                {parts[0]}
                <span className="text-red-500 font-black italic">
                  {logoDelete.name}
                </span>
                {parts[1]}
              </>
            );
          })()
        }
        confirmLabel={locale.DeleteLogoConfirmButton}
        icon={Trash2}
        iconColor="red"
        iconColorClass="text-red-500"
        danger
        theme={theme}
        themeClasses={themeClasses}
      />

      <PromptModal
        isOpen={logoRename.open}
        onClose={() => setLogoRename({ open: false, name: null })}
        onConfirm={(newName) => handleRenameLogo(logoRename.name, newName)}
        loading={logoPending}
        title={locale.RenameLogoModalTitle}
        label={locale.FileNameLabel}
        defaultValue={stripLogoExtension(logoRename.name)}
        confirmLabel={locale.SaveButton}
        validate={(value) =>
          value.trim() ? null : locale.NameCannotBeEmpty
        }
        icon={Pencil}
        iconColor="amber"
        theme={theme}
        themeClasses={themeClasses}
      />

      <ConfirmModal
        isOpen={plankDelete.open}
        onClose={() => setPlankDelete({ open: false, name: null })}
        onConfirm={handleDeletePlank}
        loading={plankPending}
        title={locale.DeletePlankModalTitle}
        message={
          (() => {
            const parts = locale.DeletePlankModalMessage.split("%v");
            return (
              <>
                {parts[0]}
                <span className="text-red-500 font-black italic">
                  {plankDelete.name}
                </span>
                {parts[1]}
              </>
            );
          })()
        }
        confirmLabel={locale.DeletePlankConfirmButton}
        icon={Trash2}
        iconColor="red"
        iconColorClass="text-red-500"
        danger
        theme={theme}
        themeClasses={themeClasses}
      />

      <PromptModal
        isOpen={plankRename.open}
        onClose={() => setPlankRename({ open: false, name: null })}
        onConfirm={(newName) => handleRenamePlank(plankRename.name, newName)}
        loading={plankPending}
        title={locale.RenamePlankModalTitle}
        label={locale.FileNameLabel}
        defaultValue={stripLogoExtension(plankRename.name)}
        confirmLabel={locale.SaveButton}
        validate={(value) =>
          value.trim() ? null : locale.NameCannotBeEmpty
        }
        icon={Pencil}
        iconColor="amber"
        theme={theme}
        themeClasses={themeClasses}
      />

      <ValidationModal
        isOpen={!!plankError}
        onClose={() => setPlankError("")}
        message={plankError}
        locale={{ ErrorFillParams: locale.ErrorTitle, OkButtonLabel: locale.OkButtonLabel }}
        themeClasses={themeClasses}
      />

      <ValidationModal
        isOpen={!!logoError}
        onClose={() => setLogoError("")}
        message={logoError}
        locale={{ ErrorFillParams: locale.ErrorTitle, OkButtonLabel: locale.OkButtonLabel }}
        themeClasses={themeClasses}
      />
    </PanelTemplate>
  );
};

export default WidgetScoreboardPlate;