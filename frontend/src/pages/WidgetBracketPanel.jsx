import React, { useCallback, useState, useMemo, useRef, useEffect } from "react";
import {
  Globe,
  GitFork,
  Paintbrush,
  Square,
  Play,
  Copy,
  List,
  Wallpaper,
  GitGraph,
} from "lucide-react";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";
import { Field } from "../components/ui/Field.jsx";
import { ValidationModal } from "../components/ValidationModal.jsx";
import { listGames } from "../utils/listGames.js";
import { ButtonFooter } from "../components/ui/ButtonFooter.jsx";
import { locales } from "../utils/listLocales.js";
import { ActionButton } from "../components/ui/ActionButton.jsx";
import { useStartToggle } from "../hooks/WidgetBracketPanel/useStartToggle.jsx";
import { ToggleSwitch } from "../components/ui/ToggleSwitch.jsx";
import { useGetListThemes } from "../hooks/WidgetBracketPanel/useGetListThemes.jsx";

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
}) => {
  const urlToTournament = tourneyCfg?.widgetBracket?.urlToTournament || "";
  const themeBracket = tourneyCfg?.widgetBracket?.theme || "StartGG";
  const clearBackground = tourneyCfg.widgetBracket?.clearBackground ?? false;
  const losersBracket = tourneyCfg.widgetBracket?.losersBracket ?? false;
  const hideStages = tourneyCfg.widgetBracket?.hideStages ?? false;
  const themeOptions = useGetListThemes();

  // State for ready of notification system
  const isReadyToStart = urlToTournament;
  
  // State for revial validation alert
  // TODO: Add validation alert modal
  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });

  const handleTournamentUrlChange = useCallback((value) => {
    updateConfig("tournament", {
      widgetBracket: {
          ...tourneyCfg.widgetBracket,
          urlToTournament: value,
       },
    });
  }, [tourneyCfg.widgetBracket, updateConfig]);
  const handleThemeBracketChange = useCallback((value) => {
    updateConfig("tournament", {
      widgetBracket: {
          ...tourneyCfg.widgetBracket,
          theme: value,
       },
    });
  }, [tourneyCfg.widgetBracket, updateConfig]);
  const handleHideStagesChange = useCallback((value) => {
      updateConfig("tournament", {
        widgetBracket: {
          ...tourneyCfg.widgetBracket,
          hideStages: value,
       },
      });
    }, [tourneyCfg.widgetBracket, updateConfig]);
  const handleClearBackgroundChange = useCallback((value) => {
      updateConfig("tournament", {
        widgetBracket: {
          ...tourneyCfg.widgetBracket,
          clearBackground: value,
       },
      });
    }, [tourneyCfg.widgetBracket, updateConfig]);
  const handleOnlyLosersChange = useCallback((value) => {
      updateConfig("tournament", {
        widgetBracket: {
          ...tourneyCfg.widgetBracket,
          losersBracket: value,
       },
      });
    }, [tourneyCfg.widgetBracket, updateConfig]);

  const getButtonStyle = getLaunchButtonStyle(isWidgetBracketRunning, false);

  // Handler for start proccess
  const handleWidgetBracketToggle = useStartToggle(
    isWidgetBracketRunning,
    setIsWidgetBracketRunning,
    isProcessing,
    setIsProcessingWB,
    setStatusWidgetBracket,
    { activePlatform, tourneyCfg },
  );

   // ============================================================
  // URL с флагами — пересчитывается при любом изменении
  // ============================================================
  const bracketUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('theme', themeBracket);

    if (clearBackground) params.set('transparent', '1');
    if (hideStages)      params.set('hideRounds', '1');
    if (losersBracket)   params.set('losersOnly', '1');

    return `http://localhost:8080/widget/bracket/${urlToTournament}?${params.toString()}`;
  }, [urlToTournament, themeBracket, clearBackground, hideStages, losersBracket]);

  // ============================================================
  // Отправка изменений в iframe через postMessage
  // ============================================================
  useEffect(() => {
    if (!isWidgetBracketRunning) return;

    const iframe = iframeRef_WidgetBracket?.current;
    if (!iframe) return;

    const sendFlags = () => {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage({
        type: 'bracket:flags-changed',
        flags: {
          transparent: clearBackground,
          hideRounds:  hideStages,
          losersOnly:  losersBracket,
        },
      }, '*');
    };

    // Отправляем при изменении флагов
    sendFlags();

    // И повторно — при загрузке iframe (на случай, если он ещё грузился)
    iframe.addEventListener('load', sendFlags);

    return () => {
      iframe.removeEventListener('load', sendFlags);
    };
  }, [clearBackground, hideStages, losersBracket, isWidgetBracketRunning]);

  const initialSrcRef = useRef(null);

  // Фиксируем начальный URL при СТАРТЕ виджета
  useEffect(() => {
    if (isWidgetBracketRunning && !initialSrcRef.current) {
      initialSrcRef.current = bracketUrl;
    }
    if (!isWidgetBracketRunning) {
      initialSrcRef.current = null;
    }
  }, [isWidgetBracketRunning, bracketUrl]);

  // Отправка postMessage
  useEffect(() => {
    if (!isWidgetBracketRunning) return;
    const iframe = iframeRef_WidgetBracket?.current;
    if (!iframe) return;

    const sendFlags = () => {
      iframe.contentWindow?.postMessage({
        type: 'bracket:flags-changed',
        flags: {
          transparent: clearBackground,
          hideRounds:  hideStages,
          losersOnly:  losersBracket,
        },
      }, '*');
    };

    sendFlags();
    iframe.addEventListener('load', sendFlags);
    return () => iframe.removeEventListener('load', sendFlags);
  }, [clearBackground, hideStages, losersBracket, isWidgetBracketRunning]);


  return (
    <PanelTemplate
      themeClasses={themeClasses}
    >
      <div className="grid grid-cols-15 gap-8 items-stretch flex-1 min-h-0">
        <div className="col-span-12 min-h-0">
          <div className={`w-full h-full rounded-[2.5rem] ${themeClasses.button}`}>
            {isWidgetBracketRunning && (
              <iframe
                src={initialSrcRef.current || bracketUrl}
                ref={iframeRef_WidgetBracket}
                className="w-full h-full border-0 rounded-[2.5rem]"
                title="Tournament Bracket"
                allowTransparency={`${clearBackground ? true : false}`}
              /> 
            )}
          </div>
        </div>

        {/* Right part */}
        <div className="col-span-3 flex flex-col h-full">
          <div className="space-y-4">
            <Field
              label={locale.UrlToBracketLabel+"*"}
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
            <ToggleSwitch
                label={locale.LosersBracket}
                icon={GitGraph}
                checked={losersBracket}
                color="amber"
                themeClasses={themeClasses}
                onChange={handleOnlyLosersChange}
            />
            {isWidgetBracketRunning ? 
            <Field
                label={locale.LinkOfWidget}
                variant="copy"
                value={bracketUrl}
                themeClasses={themeClasses}
            /> : ""}
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
      {/* <ValidationModal
        isOpen={validationAlert.isOpen}
        onClose={() => setValidationAlert({ isOpen: false, message: "" })}
        message={validationAlert.message}
        theme={theme}
        locale={localeValidation}
        themeClasses={themeClasses}
      /> */}
    </PanelTemplate>
  );
};

export default WidgetBracketPlate;
