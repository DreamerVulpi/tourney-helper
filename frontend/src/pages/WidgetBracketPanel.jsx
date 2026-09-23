import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  Globe,
  Paintbrush,
  Square,
  Play,
  List,
  Wallpaper,
  GitGraph,
  ZoomIn,
  Layers,
  Trophy,
  GitBranch,
  GitFork,
  Loader2,
} from "lucide-react";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";
import { Field } from "../components/ui/Field.jsx";
import { ButtonFooter } from "../components/ui/ButtonFooter.jsx";
import { ActionButton } from "../components/ui/ActionButton.jsx";
import { useStartToggle } from "../hooks/WidgetBracketPanel/useStartToggle.jsx";
import { ToggleSwitch } from "../components/ui/ToggleSwitch.jsx";
import { useGetListThemes } from "../hooks/WidgetBracketPanel/useGetListThemes.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { SectionBlock } from "../components/ui/SectionBlock.jsx";

const clampScale = (s) => {
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return 1.0;
  return Math.max(0.5, Math.min(2.0, n));
};

const WidgetBracketPlate = ({
  theme,
  locale,
  themeClasses,
  activeModal,
  statusWidgetBracket,
  tourneyCfg,
  activePlatform,
  updateConfig,
  isProcessing,
  setIsProcessingWB,
  isWidgetBracketRunning,
  setIsWidgetBracketRunning,
  setStatusWidgetBracket,
  iframeRef_WidgetBracket,

  // Флаги и сеттер из App.jsx
  bracketFlags,
  setBracketFlags, // (prev => ({...}))
}) => {
  const urlToTournament = tourneyCfg?.widgetBracket?.urlToTournament || "";
  const themeBracket = tourneyCfg?.widgetBracket?.theme || "StartGG";
  const themeOptions = useGetListThemes();

  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Значения флагов из общего состояния
  const {
    transparent: clearBackground,
    hideRounds: hideStages,
    bracketMode: bracketMode,
    scale: scale,
  } = bracketFlags;

  const readyScale = clampScale(scale);
  const isReadyToStart = urlToTournament;

  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });

  // ---------- Обработчики полей туринра ----------
  const handleTournamentUrlChange = useCallback(
    (value) => {
      updateConfig("tournament", {
        widgetBracket: {
          ...tourneyCfg.widgetBracket,
          urlToTournament: value,
        },
      });
    },
    [tourneyCfg.widgetBracket, updateConfig],
  );

  const handleThemeBracketChange = useCallback(
    (value) => {
      updateConfig("tournament", {
        widgetBracket: {
          ...tourneyCfg.widgetBracket,
          theme: value,
        },
      });
    },
    [tourneyCfg.widgetBracket, updateConfig],
  );

  // ---------- Обработчики тумблеров ----------
  // Обновляем флаги в App через setBracketFlags (functional update)
  const handleClearBackgroundChange = useCallback(
    (value) => {
      console.log("[WidgetBracketPlate] clearBackground change:", value);
      setBracketFlags((prev) => {
        console.log("[WidgetBracketPlate] prev:", prev);
        const next = { ...prev, transparent: value };
        console.log("[WidgetBracketPlate] next:", next);
        return next;
      });
    },
    [setBracketFlags],
  );

  const handleHideStagesChange = useCallback(
    (value) => {
      setBracketFlags((prev) => ({ ...prev, hideRounds: value }));
    },
    [setBracketFlags],
  );

  const handleBracketModeChange = useCallback(
    (value) => {
      setBracketFlags((prev) => ({ ...prev, bracketMode: value }));
    },
    [setBracketFlags],
  );

  const handleScaleChange = useCallback(
    (value) => {
      console.log("[WidgetBracketPlate] scale input:", value, typeof value);
      const num = clampScale(value);
      console.log("[WidgetBracketPlate] scale normalized:", num);
      setBracketFlags((prev) => ({ ...prev, scale: num }));
    },
    [setBracketFlags],
  );

  const getButtonStyle = getLaunchButtonStyle(isWidgetBracketRunning, false);

  const handleWidgetBracketToggle = useStartToggle(
    isWidgetBracketRunning,
    setIsWidgetBracketRunning,
    isProcessing,
    setIsProcessingWB,
    setStatusWidgetBracket,
    { activePlatform, tourneyCfg },
  );

  // ---------- URL с флагами ----------
  const bracketUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("theme", themeBracket);

    if (clearBackground) params.set("transparent", "1");
    if (hideStages) params.set("hideRounds", "1");
    if (bracketMode !== "all") params.set("bracketMode", bracketMode);
    if (scale !== 1.0) params.set("scale", String(scale));

    return `http://localhost:8080/widget/bracket/${urlToTournament}?${params.toString()}`;
  }, [
    urlToTournament,
    themeBracket,
    clearBackground,
    hideStages,
    bracketMode,
    scale,
  ]);

  // ---------- Фиксируем начальный URL при старте виджета ----------
  const initialSrcRef = useRef(null);

  // Обновляем src iframe при старте виджета, смене турнира или темы.
  // Смена флагов (bracketMode, hideRounds, transparent, scale) НЕ триггерит
  // перезагрузку — они уходят через postMessage.
  useEffect(() => {
      if (isWidgetBracketRunning) {
          initialSrcRef.current = bracketUrl;
          setIframeLoaded(false);
      } else {
          initialSrcRef.current = null;
          setIframeLoaded(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetBracketRunning, urlToTournament, themeBracket]);

 

  // ---------- Отправка postMessage в iframe ----------
  useEffect(() => {
    if (!isWidgetBracketRunning) return;

    const iframe = iframeRef_WidgetBracket?.current;
    if (!iframe) return;

    const sendFlags = () => {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        {
          type: "bracket:flags-changed",
          flags: {
            transparent: clearBackground,
            hideRounds: hideStages,
            bracketMode: bracketMode,
          },
        },
        "*",
      );
    };

    // 1. Отправляем сразу
    sendFlags();

    // 2. Повторяем при загрузке iframe (если он ещё грузился)
    iframe.addEventListener("load", sendFlags);

    return () => {
      iframe.removeEventListener("load", sendFlags);
    };
  }, [
    clearBackground,
    hideStages,
    bracketMode,
    isWidgetBracketRunning,
    iframeRef_WidgetBracket,
  ]);

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="grid grid-cols-16 gap-8 items-stretch flex-1 min-h-0">
        <div className="col-span-12 min-h-0">
          <div
            className={`relative w-full h-full rounded-[0.5rem] ${themeClasses.button}`}
          >
            {isWidgetBracketRunning && (
              <>
                <iframe
                  src={initialSrcRef.current || bracketUrl}
                  ref={iframeRef_WidgetBracket}
                  className="absolute inset-0 w-full h-full border-0 rounded-[0.5rem]"
                  title="Tournament Bracket"
                  allowtransparency="true"
                  onLoad={()=> setIframeLoaded(true)}
                  style={{ background: "transparent" }}
                />

                {/* Плавающая панель поверх iframe в правом верхнем углу */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 w-80">
                  <ToggleSwitch
                    solid={true}
                    label={locale.BracketDisplayMode}
                    value={bracketMode}
                    options={[
                      { value: "all", label: locale.AllMode, icon: Layers },
                      {
                        value: "winners",
                        label: locale.WinnersMode,
                        icon: GitBranch,
                      },
                      {
                        value: "losers",
                        label: locale.LosersMode,
                        icon: GitGraph,
                      },
                    ]}
                    color="amber"
                    themeClasses={themeClasses}
                    onChange={handleBracketModeChange}
                  />
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
            {!iframeLoaded && isWidgetBracketRunning && (
                <div className="absolute inset-0 flex items-center rounded-[0.5rem] justify-center z-20 bg-slate-900/80 backdrop-blur-sm">
                    <EmptyState
                        icon={Loader2}
                        title={locale.LoadBracket}
                        description={locale.FetchData}
                    />
                </div>
            )}
            {!isWidgetBracketRunning && (
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 w-80`}>
                  <EmptyState
                      icon={GitFork}
                      title={locale.WidgetNotRunning}
                      description={locale.ClickStartDescription}
                  />
                </div>
            )}
          </div>
        </div>

        {/* Правая часть */}
        <div className="col-span-4 flex flex-col h-full">
          <div className="space-y-4">
            <Field
              label={locale.UrlToBracketLabel + "*"}
              witdh="320"
              icon={Globe}
              onChange={handleTournamentUrlChange}
              value={urlToTournament}
              themeClasses={themeClasses}
            />
            <Field
              variant="select"
              label={locale.ListOfThemes}
              icon={Paintbrush}
              onChange={handleThemeBracketChange}
              value={themeBracket}
              themeClasses={themeClasses}
              items={themeOptions}
            />
            <ToggleSwitch
              label={locale.ClearBackground}
              icon={Wallpaper}
              checked={clearBackground}
              color="amber"
              themeClasses={themeClasses}
              onChange={handleClearBackgroundChange}
            />
            <ToggleSwitch
              label={locale.HideTheStages}
              icon={List}
              checked={hideStages}
              color="amber"
              themeClasses={themeClasses}
              onChange={handleHideStagesChange}
            />
            
              
            
            {isWidgetBracketRunning && (
              <SectionBlock
                title={locale.LinkOfWidget}
                titleAlign="center"
                theme={theme}>
                <Field
                  variant="copy"
                  value={bracketUrl}
                  themeClasses={themeClasses}
                />
              </SectionBlock>
            )}
          </div>
          <ButtonFooter
            absolute={false}
            className="mt-auto flex justify-center w-full"
          >
            <ActionButton
              icon={isWidgetBracketRunning ? Square : Play}
              loading={isProcessing}
              disabled={!isReadyToStart}
              expandOnHover={isWidgetBracketRunning && !isProcessing}
              className={getButtonStyle}
              iconClassName="fill-white"
              onClick={handleWidgetBracketToggle}
            >
              {isWidgetBracketRunning ? locale.Stop : locale.Start}
            </ActionButton>
          </ButtonFooter>
        </div>
      </div>
    </PanelTemplate>
  );
};

export default WidgetBracketPlate;
