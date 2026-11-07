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
  ZoomIn,
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
  Download,
  Globe,
  User
} from "lucide-react";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";
import { Field } from "../components/ui/Field.jsx";
import { ButtonFooter } from "../components/ui/ButtonFooter.jsx";
import { ActionButton } from "../components/ui/ActionButton.jsx";
import { useStartToggle } from "../hooks/WidgetScoreboardPanel/useStartToggle.jsx";
import { useGetListFlags } from "../hooks/WidgetScoreboardPanel/useGetListFlags.jsx";
import { useGetListThemes } from "../hooks/WidgetBracketPanel/useGetListThemes.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { SectionBlock } from "../components/ui/SectionBlock.jsx";
import { getThemeClasses } from "../utils/themeClasses.jsx";
import { useThemeClasses } from "../hooks/App/useThemeClasses";
import { useAppStore } from "../store/useAppStore";
import { FORMAT_OPTIONS } from "../utils/formatMatches.js"
import { TabbedSection } from "../components/ui/tabbedSection.jsx";

const clampScale = (s) => {
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return 1.0;
  return Math.max(0.5, Math.min(2.0, n));
};

const DEFAULT_SIDE = {
  name: "Player",
  logoPath: "",
  flag: "",
  points: 0,
  showLogo: true,
  showFlag: true,
};

const defaultSideFor = (side) => ({
  ...DEFAULT_SIDE,
  name: side === "P2" ? "Player 2" : "Player 1",
});

// Хелпер: частичный апдейт стороны P1/P2 + titleMatch через updateConfig
const patchScoreboard = (updateConfig, patch) =>
  updateConfig("widgets", { scoreboard: patch });

const WidgetScoreboardPlate = ({
  locale,
  updateConfig,
  isProcessing,
  setIsProcessingWS,
  isWidgetScoreboardRunning,
  setIsWidgetScoreboardRunning,
  iframeRef_WidgetScoreboard,
}) => {
  // ---- store ----
  const theme = useAppStore((s) => s.theme);
  const setStatusWidgetScoreboard = useAppStore(
    (s) => s.setStatusWidgetScoreboard,
  );
  const themeClasses = useThemeClasses(getThemeClasses);
  const widgets = useAppStore((s) => s.widgets);
  const scoreboard = widgets?.scoreboard;

  // ---- поля из конфига (единый источник истины) ----
  const themeScoreboard = scoreboard?.theme ?? "Default";
  const titleMatch = scoreboard?.titleMatch ?? "CUSTOM NAME";
  const hideLogos = scoreboard?.hideLogos ?? false;
  const hideFlags = scoreboard?.hideFlags ?? false;
  const scale = scoreboard?.scale ?? 1.0;
  const format = scoreboard?.format ?? "FT2";
  const p1 = scoreboard?.P1 ?? defaultSideFor("P1");
  const p2 = scoreboard?.P2 ?? defaultSideFor("P2");

  const [activeTabP1, setActiveTabP1] = useState("logo");
  const [activeTabP2, setActiveTabP2] = useState("logo");

  const themeOptions = useGetListThemes();
  const flagOptions = useGetListFlags(locale.FlagNames);
  const readyScale = clampScale(scale);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleWidgetScoreboardToggle = useStartToggle(
    isWidgetScoreboardRunning,
    setIsWidgetScoreboardRunning,
    isProcessing,
    setIsProcessingWS,
    setStatusWidgetScoreboard,
  );

  // ---------- Обработчики конфига ----------
  const handleThemeChange = useCallback(
    (value) => patchScoreboard(updateConfig, { theme: value }),
    [updateConfig],
  );
  const handleHideLogosChange = useCallback(
    (value) => patchScoreboard(updateConfig, { hideLogos: value }),
    [updateConfig],
  );
  const handleHideFlagsChange = useCallback(
    (value) => patchScoreboard(updateConfig, { hideFlags: value }),
    [updateConfig],
  );
  const handleScaleChange = useCallback(
    (value) => patchScoreboard(updateConfig, { scale: clampScale(value) }),
    [updateConfig],
  );
  const handleTitleChange = useCallback(
    (value) => patchScoreboard(updateConfig, { titleMatch: value }),
    [updateConfig],
  );

  const handleFormatChange = useCallback(
    (value) => patchScoreboard(updateConfig, { format: value }),
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
      P1: { ...DEFAULT_SIDE, name: "Player 1" },
      P2: { ...DEFAULT_SIDE, name: "Player 2" },
    });
  }, [updateConfig]);

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
      const current = scoreboard?.[side]?.[field] ?? true;
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

  // ---------- URL ----------
  const scoreboardUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("theme", themeScoreboard);
    if (hideLogos) params.set("hideLogos", "1");
    if (hideFlags) params.set("hideFlags", "1");
    if (readyScale !== 1.0) params.set("scale", String(readyScale));
    return `http://localhost:8080/widgets/scoreboard?${params.toString()}`;
  }, [themeScoreboard, hideLogos, hideFlags, readyScale]);

  // ---------- Фиксируем src при старте; при смене темы — перезагружаем ----------
  const initialSrcRef = useRef(null);
  useEffect(() => {
    if (!isWidgetScoreboardRunning) {
      initialSrcRef.current = null;
      setIframeLoaded(false);
      return;
    }
    initialSrcRef.current = scoreboardUrl;
    setIframeLoaded(false);
  }, [isWidgetScoreboardRunning, themeScoreboard]); // флаги НЕ триггерят reload

  // ---------- postMessage на флаги/scale (без перезагрузки) ----------
  useEffect(() => {
    if (!isWidgetScoreboardRunning) return;
    const iframe = iframeRef_WidgetScoreboard?.current;
    if (!iframe) return;

    const sendFlags = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "scoreboard:flags-changed",
          flags: {
            hideLogos,
            hideFlags,
            scale: readyScale,
          },
        },
        "*",
      );
    };
    sendFlags();
    iframe.addEventListener("load", sendFlags);
    return () => iframe.removeEventListener("load", sendFlags);
  }, [
    hideLogos,
    hideFlags,
    readyScale,
    isWidgetScoreboardRunning,
    iframeRef_WidgetScoreboard,
  ]);

  const isStartDisabled = isProcessing || isWidgetScoreboardRunning;
  const isStopDisabled = isProcessing;
  const getButtonStyle = getLaunchButtonStyle(isWidgetScoreboardRunning, false);

  const EXTRA_TABS = [
    { id: "logo", icon: ImageIcon, label: "Logo"},
    { id: "flag", icon: Flag,        label: locale.FlagsLabel ?? "Flags" }
  ]

  const renderSideControls = (side, activeTab, setActiveTab) => {
  const data = scoreboard?.[side] ?? defaultSideFor(side);
  const selectedFlag = flagOptions.find((f) => f.value === data.flag);
  const isP2 = side === "P2";

  // Блок с именем
  const nameField = (
    <div key="name" className="flex-1 min-w-0">
      <Field
        icon={User}
        variant="input"
        value={data.name}
        onChange={(val) => updateSide(side, { name: val })}
        themeClasses={themeClasses}
        placeholder="Player name"
      />
    </div>
  );

  // Блок с кнопками +/- (они всегда идут перед счетом)
  const buttonsBlock = (
    <div key="btns" className="flex flex-col gap-1">
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
    <span key="pts" className="text-xl font-bold tabular-nums w-6 text-center">
      {data.points}
    </span>
  );

  // Формируем строку в зависимости от стороны
  // P1: [Имя] --- [Кнопки] [Счет]
  // P2: [Счет] [Кнопки] --- [Имя]
  const topRow = isP2
    ? [scoreBlock, buttonsBlock, nameField]
    : [nameField, buttonsBlock, scoreBlock];

    return (
      <div
        className={`flex flex-col p-3 rounded-xl border gap-3 ${
          themeClasses?.tempSection || "bg-slate-800 border-slate-700"
        }`}
      >
        {/* Верхняя строка */}
        <div className="flex items-center justify-between gap-2">
          {topRow}
        </div>

        {/* Табы */}
        <TabbedSection
          tabs={EXTRA_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          themeClasses={themeClasses}
          className="flex-1 min-h-0"
        >
          {(tab) =>
            tab === "logo" ? (
              <div className="flex gap-2 items-start pt-2">
                {/* Квадрат логотипа */}
                <div className="relative w-18 h-18 flex-shrink-0">
                  <div
                    className={`w-full h-full rounded-lg border flex items-center justify-center ${
                      themeClasses?.field || "bg-slate-900 border-slate-700"
                    }`}
                  >
                    <ImageIcon
                      className={data.showLogo !== false ? "text-slate-500 opacity-50" : "text-slate-700 opacity-30"}
                      size={24}
                    />
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(side, "showLogo")}
                    className={`absolute -bottom-1 -right-1 p-1 rounded-md border shadow-sm transition-colors z-10 ${
                      data.showLogo !== false
                        ? "bg-slate-700 border-slate-600 text-green-400 hover:bg-slate-600"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
                    }`}
                    title={data.showLogo !== false ? "Скрыть логотип" : "Показать логотип"}
                  >
                    {data.showLogo !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                </div>

                {/* Инпуты */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Field
                    icon={Globe}
                    variant="input"
                    value={data.logoPath}
                    onChange={(val) => updateSide(side, { logoPath: val })}
                    themeClasses={themeClasses}
                    placeholder="Logo path"
                    height="2rem"
                  />
                  <Field
                    variant="button"
                    icon={Download}
                    labelButton={"Choose file"}
                    height="2.1rem"
                    themeClasses={themeClasses}
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
                    title={data.showFlag !== false ? "Скрыть флаг" : "Показать флаг"}
                  >
                    {data.showFlag !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Field
                    variant="multiselect"
                    single
                    searchable
                    label={locale.FlagsLabel ?? "Flags"}
                    value={data.flag ? [data.flag] : []}
                    onChange={(values) => updateSide(side, { flag: values?.[0] ?? "" })}
                    items={flagOptions}
                    themeClasses={themeClasses}
                    height="1.9rem"
                    placeholder={locale.FlagPlaceholder ?? "Country flag"}
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
            ) : null
          }
        </TabbedSection>
      </div>
    );
  };

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="flex flex-col gap-4 flex-1 min-h-0 w-full">
        <div className="col-span-16 min-h-0 flex flex-col gap-4 h-full">
          
          {/* Превью (Iframe) */}
          <div
            className={`relative w-full h-44 shrink-0 rounded-[0.5rem] ${themeClasses.button}`}
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
                  src={initialSrcRef.current || scoreboardUrl}
                  ref={iframeRef_WidgetScoreboard}
                  className="absolute inset-0 w-full h-full border-0 rounded-[0.5rem]"
                  title="Scoreboard"
                  allowtransparency="true"
                  onLoad={() => setIframeLoaded(true)}
                  style={{ background: "transparent" }}
                />

                <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 w-80">
                  <SectionBlock
                    solid={true}
                    title={locale.LinkOfWidget}
                    titleAlign="center"
                    theme={theme}
                  >
                    <Field
                      variant="copy"
                      value={scoreboardUrl}
                      themeClasses={themeClasses}
                    />
                  </SectionBlock>
                </div>

                <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 w-80">
                  <Field
                    solid={true}
                    variant="range"
                    icon={ZoomIn}
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    onChange={handleScaleChange}
                    value={readyScale}
                    themeClasses={themeClasses}
                  />
                </div>
              </>
            )}

            {!iframeLoaded && isWidgetScoreboardRunning && scoreboardUrl && (
              <div className="absolute inset-0 flex items-center rounded-[0.5rem] justify-center z-20 bg-slate-900/80 backdrop-blur-sm">
                <EmptyState
                  icon={Loader2}
                  title={locale.LoadBracket}
                  description={locale.FetchData}
                />
              </div>
            )}
          </div>

          {/* Игроки: P1 — центр — P2 */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start shrink-0 flex-1">
            {/* Левая сторона (P1) */}
            {renderSideControls("P1", activeTabP1, setActiveTabP1)}

            {/* Центр (Настройки матча) */}
            <div className="flex flex-col gap-4 pt-1 items-center w-[17rem]">
              {/* Title Event */}
              <div className="w-full">
                <Field
                  variant="input"
                  label={"Title event"}
                  value={titleMatch}
                  onChange={handleTitleChange}
                  themeClasses={themeClasses}
                  icon={Trophy}
                  placeholder="Match title"
                />
              </div>

              {/* Format + Кнопки */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex flex-row gap-1 w-full mt-1 items-start">
                  <div className="flex-1 min-w-0">
                    <Field
                      variant="multiselect"
                      single
                      searchable
                      icon={Swords}
                      label={locale.Format ?? "Format"}
                      value={[format]}
                      onChange={handleFormatChange}
                      items={FORMAT_OPTIONS}
                      themeClasses={themeClasses}
                      height="1.9rem"
                      placeholder="FT"
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
                
                <div className="flex flex-row gap-1 w-full mt-1">
                  <button
                    type="button"
                    onClick={handleSwitchSides}
                    style={{ height: "1.9rem" }}
                    className={`flex-1 flex items-center justify-center rounded-xl border text-xs font-black uppercase italic ${themeClasses.button}`}
                    title="Сменить стороны"
                  >
                    <ArrowLeftRight size={16} className="text-blue-500" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetScore}
                    style={{ height: "1.9rem" }}
                    className={`flex-1 flex items-center justify-center rounded-xl border text-xs font-black uppercase italic ${themeClasses.button}`}
                    title="Сбросить счет"
                  >
                    <RotateCcw size={16} className="text-blue-500" />
                  </button>
                </div>
              </div>

              {/* Start / Stop Кнопка */}
              <div className="w-full mt-2">
                <ActionButton
                  icon={isWidgetScoreboardRunning ? Square : Play}
                  loading={isProcessing}
                  disabled={
                    isWidgetScoreboardRunning ? isStopDisabled : isStartDisabled
                  }
                  expandOnHover={isWidgetScoreboardRunning && !isProcessing}
                  className={`${getButtonStyle} w-full`}
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
    </PanelTemplate>
  );
};

export default WidgetScoreboardPlate;