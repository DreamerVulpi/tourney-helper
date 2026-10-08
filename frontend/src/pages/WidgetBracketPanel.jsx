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
  AlertCircle,
  RefreshCw,
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
import { ValidateTournamentURL, ParseTournamentURLForWidget } from "../../wailsjs/go/application/App.js"
import { debounce } from "../utils/debounce.jsx";
import { UrlValidationMessage } from "../hooks/App/useValidationUrl.jsx";
import { useThemeClasses } from "../hooks/App/useThemeClasses"
import { getThemeClasses } from "../utils/themeClasses";
import { useAppStore } from "../store/useAppStore";

const clampScale = (s) => {
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return 1.0;
  return Math.max(0.5, Math.min(2.0, n));
};

const WidgetBracketPlate = ({
  locale,
  updateConfig,
  isProcessing,
  setIsProcessingWB,
  isWidgetBracketRunning,
  setIsWidgetBracketRunning,
  iframeRef_WidgetBracket,
  bracketFlags,
  setBracketFlags,
  urlValidation,
  setURLValidation,
}) => {
     // ---- store ----
  const theme          = useAppStore((s) => s.theme);
  const activeModal    = useAppStore((s) => s.activeModal);
  const activePlatform = useAppStore((s) => s.activeTournamentPlatform);
  // TODO: Fix to widgets.bracket
  const tournament     = useAppStore((s) => s.tournament);
  const setStatusWidgetBracket = useAppStore((s) => s.setStatusWidgetBracket);

  // ---- производные ----
  const themeClasses = useThemeClasses(getThemeClasses);

  const urlToTournament = tournament?.widgetBracket?.urlToTournament || "";
  const bracketId = tournament?.widgetBracket?.bracketId || "";
  const themeBracket = tournament?.widgetBracket?.theme || "StartGG";
  const themeOptions = useGetListThemes();

  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Значения флагов из общего состояния
  const {
    transparent: clearBackground,
    hideRounds: hideStages,
    bracketMode: bracketMode,
    scale: scale,
    autoRefresh: autoRefresh,
  } = bracketFlags;

  const readyScale = clampScale(scale);
  const tourneyCfgRef = useRef(tournament);
  useEffect(() => {
      tourneyCfgRef.current = tournament;
  }, [tournament]);

  const debouncedParseGridId = useMemo(
  () => debounce(async (rawUrl) => {
    const cfg = tourneyCfgRef.current;
  
    if (!rawUrl || !rawUrl.trim()) {
      updateConfig("tournament", {
        widgetBracket: {
          ...cfg.widgetBracket,
          urlToTournament: rawUrl,
          bracketId: "",
        },
      });
      return;
    }

    try {
      const id = await ParseTournamentURLForWidget("startgg", rawUrl);
      updateConfig("tournament", {
        widgetBracket: {
          ...cfg.widgetBracket,
          urlToTournament: rawUrl,
          bracketId: id,
        },
      });
    } catch (err) {
      updateConfig("tournament", {
        widgetBracket: {
          ...cfg.widgetBracket,
          urlToTournament: rawUrl,
          bracketId: "",
        },
      });
    }
  }, 300),
  [updateConfig],
);

  const debouncedValidateUrl = useMemo(
      () => debounce(async (value) => {
          if (!value || !value.trim()) {
              setURLValidation({ valid: null, platform: "" });
              return;
          }
          try {
              const result = await ValidateTournamentURL(value);
              setURLValidation({
                  valid: result.valid,
                  platform: result.platform,
              });
          } catch (err) {
              setURLValidation({ valid: false, platform: "unknown" });
          }
      }, 400),
      [],
  );

  const lastValidatedUrlRef = useRef(null);

  // При монтировании / смене URL в конфиге (например, при переключении вкладок) —
  // валидируем и парсим URL один раз, если он есть.
  useEffect(() => {
      if (!urlToTournament || !urlToTournament.trim()) {
            setURLValidation({ valid: null, platform: "" });
            lastValidatedUrlRef.current = null;
       
            if (bracketId) {
            updateConfig("tournament", {
                widgetBracket: { ...tournament.widgetBracket, urlToTournament: "", bracketId: "" },
            });
            }
            return;
        }

      if (lastValidatedUrlRef.current === urlToTournament) {
          return;
      }

      lastValidatedUrlRef.current = urlToTournament;

      debouncedValidateUrl(urlToTournament);
      debouncedParseGridId(urlToTournament);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToTournament]);

  const handleTournamentUrlChange = useCallback(
    (value) => {
          // 1. Сохраняем сырую ссылку в конфиг (UI покажет её)
          updateConfig("tournament", {
              widgetBracket: {
                  ...tournament.widgetBracket,
                  urlToTournament: value,
              },
          });
      },
      [tournament.widgetBracket, updateConfig],
  );

  const handleThemeBracketChange = useCallback(
    (value) => {
      updateConfig("tournament", {
        widgetBracket: {
          ...tournament.widgetBracket,
          theme: value,
        },
      });
    },
    [tournament.widgetBracket, updateConfig],
  );

  // ---------- Обработчики тумблеров ----------
  // Обновляем флаги в App через setBracketFlags (functional update)
  const handleClearBackgroundChange = useCallback(
    (value) => {
      setBracketFlags((prev) => {
        const next = { ...prev, transparent: value };
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
      const num = clampScale(value);
      setBracketFlags((prev) => ({ ...prev, scale: num }));
    },
    [setBracketFlags],
  );

  const handleAutoRefreshChange = useCallback(
    (value) => {
      setBracketFlags((prev) => ({...prev, autoRefresh: value}));
    },
    [setBracketFlags],
  )

  const getButtonStyle = getLaunchButtonStyle(isWidgetBracketRunning, false);

  const handleWidgetBracketToggle = useStartToggle(
    isWidgetBracketRunning,
    setIsWidgetBracketRunning,
    isProcessing,
    setIsProcessingWB,
    setStatusWidgetBracket,
    { activePlatform, tourneyCfg: tournament },
  );

  // Полный URL с флагами — нужен только для отображения в UI (LinkOfWidget)
  const bracketUrl = useMemo(() => {
      if (!bracketId) return "";

      const params = new URLSearchParams();
      params.set("theme", themeBracket);

      if (clearBackground) params.set("transparent", "1");
      if (hideStages) params.set("hideRounds", "1");
      if (bracketMode !== "all") params.set("bracketMode", bracketMode);
      if (scale !== 1.0) params.set("scale", String(scale));
      if (autoRefresh) params.set("autoRefresh", "1");

      return `http://localhost:8080/widget/bracket/${bracketId}?${params.toString()}`;
  }, [bracketId, themeBracket, clearBackground, hideStages, bracketMode, scale, autoRefresh]);

  // Базовый URL — только турнир + тема. НЕ зависит от флагов.
  // Используется для начального src iframe.
  const baseIframeUrl = useMemo(() => {
      if (!bracketId) return "";
      return `http://localhost:8080/widget/bracket/${bracketId}?theme=${themeBracket}`;
  }, [bracketId, themeBracket]);

  // ---------- Фиксируем начальный URL при старте виджета ----------
  const initialSrcRef = useRef(null);

  // Сбрасываем фиксацию при смене турнира/темы
  useEffect(() => {
      initialSrcRef.current = null;
  }, [bracketId, themeBracket]);

  // Фиксируем начальный URL при старте (один раз)
  useEffect(() => {
      if (!isWidgetBracketRunning) {
          initialSrcRef.current = null;
          setIframeLoaded(false);
          return;
      }

      if (!bracketId) return;

      if (!initialSrcRef.current) {
          const params = new URLSearchParams();
          params.set("theme", themeBracket);
          if (clearBackground) params.set("transparent", "1");
          if (hideStages) params.set("hideRounds", "1");
          if (bracketMode !== "all") params.set("bracketMode", bracketMode);
          if (scale !== 1.0) params.set("scale", String(scale));
          if (autoRefresh) params.set("autoRefresh", "1");
          initialSrcRef.current = `http://localhost:8080/widget/bracket/${bracketId}?${params.toString()}`;
      }

      setIframeLoaded(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetBracketRunning, bracketId, themeBracket]);

  // Обновляем src iframe при старте виджета, смене турнира или темы.
  // Смена флагов (bracketMode, hideRounds, transparent, scale) НЕ триггерит
  // перезагрузку — они уходят через postMessage.
  useEffect(() => {
      if (isWidgetBracketRunning && baseIframeUrl) {
          initialSrcRef.current = baseIframeUrl;
          setIframeLoaded(false);
      } else {
          initialSrcRef.current = null;
          setIframeLoaded(false);
      }
  }, [isWidgetBracketRunning, baseIframeUrl]);

 

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
                      scale: readyScale,
                      autoRefresh: autoRefresh,
                  },
              },
              "*",
          );
      };

      sendFlags();
      iframe.addEventListener("load", sendFlags);
      return () => iframe.removeEventListener("load", sendFlags);
  }, [
      clearBackground,
      hideStages,
      bracketMode,
      readyScale,
      autoRefresh,
      isWidgetBracketRunning,
      iframeRef_WidgetBracket,
  ]);
    // Start доступен, только если:
  //  - виджет ещё не запущен
  //  - URL валиден
  //  - не идёт обработка
  const isStartDisabled =
      isProcessing ||
      isWidgetBracketRunning ||
      urlValidation.valid !== true;

  // Stop доступен всегда, пока виджет запущен,
  // даже если URL сейчас невалиден или пустой.
  // Блокируется только во время обработки.
  const isStopDisabled = isProcessing; 

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="grid grid-cols-16 gap-8 items-stretch flex-1 min-h-0">
        <div className="col-span-12 min-h-0">
          <div className={`relative w-full h-full rounded-[0.5rem] ${themeClasses.button}`}>
            {/* ============================================================
            * 1. Ошибка валидации — приоритет №1
            * ============================================================ */}
            {urlValidation.valid === false && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[0.5rem] z-30 bg-slate-900/80 backdrop-blur-sm">
                    <EmptyState
                        icon={AlertCircle}
                        title={locale.ValidationUrlBracket.InvalidUrlTitle}
                        description={
                            urlValidation.platform === "unknown"
                                ? (locale.ValidationUrlBracket.UnsupportedPlatform)
                                : (locale.ValidationUrlBracket.InvalidUrlDescription)
                        }
                    />
                </div>
            )}

            {/* ============================================================
            * 2. Пустой URL (и валидации не было) — приоритет №2
            * ============================================================ */}
            {urlValidation.valid !== false && !urlToTournament && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[0.5rem]">
                    <EmptyState
                        icon={Globe}
                        title={locale.ValidationUrlBracket.EnterUrlTitle}
                        description={locale.ValidationUrlBracket.EnterUrlDescription}
                    />
                </div>
            )}

            {/* ============================================================
            * 3. Виджет не запущен (но URL введён и валиден) — приоритет №3
            * ============================================================ */}
            {urlValidation.valid !== false && !!urlToTournament && !isWidgetBracketRunning && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 w-80">
                    <EmptyState
                        icon={GitFork}
                        title={locale.WidgetNotRunning}
                        description={locale.ClickStartDescription}
                    />
                </div>
            )}

            {/* ============================================================
            * 4. Iframe — когда виджет запущен, URL валиден, есть bracketUrl
            * ============================================================ */}
            {urlValidation.valid !== false && isWidgetBracketRunning && bracketUrl && (
                <>
                    <iframe
                        src={initialSrcRef.current || bracketUrl}
                        ref={iframeRef_WidgetBracket}
                        className="absolute inset-0 w-full h-full border-0 rounded-[0.5rem]"
                        title="Tournament Bracket"
                        allowtransparency="true"
                        onLoad={() => setIframeLoaded(true)}
                        style={{ background: "transparent" }}
                    />

                    {/* Плавающая панель сверху */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 w-80">
                        <ToggleSwitch
                            solid={true}
                            label={locale.BracketDisplayMode}
                            value={bracketMode}
                            options={[
                                { value: "all", label: locale.AllMode, icon: Layers },
                                { value: "winners", label: locale.WinnersMode, icon: GitBranch },
                                { value: "losers", label: locale.LosersMode, icon: GitGraph },
                            ]}
                            color="amber"
                            themeClasses={themeClasses}
                            onChange={handleBracketModeChange}
                        />
                    </div>

                    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 w-80">
                      {isWidgetBracketRunning && bracketUrl && (
                        <SectionBlock
                          solid={true}
                          title={locale.LinkOfWidget}
                          titleAlign="center"
                          theme={theme}
                        >
                          <Field
                            variant="copy"
                            value={bracketUrl}
                            themeClasses={themeClasses}
                          />
                        </SectionBlock>
                      )}
                    </div>

                    {/* Плавающая панель снизу */}
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

            {/* ============================================================
            * 5. Заглушка загрузки iframe — только поверх iframe
            * ============================================================ */}
            {!iframeLoaded && isWidgetBracketRunning && bracketUrl && urlValidation.valid !== false && (
                <div className="absolute inset-0 flex items-center rounded-[0.5rem] justify-center z-20 bg-slate-900/80 backdrop-blur-sm">
                    <EmptyState
                        icon={Loader2}
                        title={locale.LoadBracket}
                        description={locale.FetchData}
                    />
                </div>
            )}
            </div>
        </div>

        {/* Правая часть */}
        <div className="col-span-4 flex flex-col h-full">
          <div className="space-y-4">
            <div className="space-y-2">
                <Field
                    label={locale.UrlToBracketLabel + "*"}
                    witdh="320"
                    icon={Globe}
                    onChange={handleTournamentUrlChange}
                    value={urlToTournament}
                    themeClasses={themeClasses}
                />
                <UrlValidationMessage
                    validation={urlValidation}
                    theme={theme}
                    locale={locale.ValidationUrlBracket}
                />
            </div>
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
            <ToggleSwitch
              label={locale.AutoRefresh}
              icon={RefreshCw}
              checked={bracketFlags.autoRefresh}
              color="amber"
              themeClasses={themeClasses}
              onChange={handleAutoRefreshChange}
            />
          </div>
          <ButtonFooter
            absolute={false}
            className="mt-auto flex justify-center w-full"
          >
            <ActionButton
                icon={isWidgetBracketRunning ? Square : Play}
                loading={isProcessing}
                disabled={isWidgetBracketRunning ? isStopDisabled : isStartDisabled}
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
