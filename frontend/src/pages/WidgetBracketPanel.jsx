import React, { useCallback, useState } from "react";
import {
  Globe,
  GitFork,
  Paintbrush,
  Square,
  Play,
} from "lucide-react";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import { getLaunchButtonStyle } from "../utils/themeClasses.jsx";
import { Field } from "../components/ui/Field.jsx";
import { ValidationModal } from "../components/ValidationModal.jsx";
import { listGames } from "../utils/listGames.js";
import { ButtonFooter } from "../components/ui/ButtonFooter.jsx";
import { locales } from "../utils/listLocales.js";
import { ActionButton } from "../components/ui/ActionButton.jsx";

const WidgetBracketPlate = ({
  theme,
  locale,
  themeClasses,
  activeModal,
  statusWidgetBracket,
  tourneyCfg,
  updateConfig,
  isProcessing,
  setIsProcessing,
  isWidgetBracketRunning,
  setIsWidgetBracketRunning,
  setStatusWidgetBracket,
}) => {
  const urlToTournament = tourneyCfg?.widgetBracket?.urlToTournament || "";
  const bracket = tourneyCfg?.widgetBracket?.bracket || "";
  const themeBracket = tourneyCfg?.widgetBracket?.theme || "StartGG";

  // State for ready of notification system
  const isReadyToStart = urlToTournament && bracket && themeBracket;
  
  // State for revial validation alert
  // TODO: Add validation alert modal
  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });

  // Handler for start proccess
  // TODO: Add method from backend
  // const handleWidgetBracketToggle = useStartToogle(
  //   isWidgetBracketRunning,
  //   setIsWidgetBracketRunning,
  //   isProcessing,
  //   setIsProcessing,
  //   setReport,
  //   setStatusNotificationSystem,
  //   { activeMessenger, activePlatform, systemCfg, tourneyCfg, lang },
  // );

  
  const handleTournamentUrlChange = useCallback((value) => {
    updateConfig("tournament", {
      widgetBracket: {
          ...tourneyCfg.widgetBracket,
          urlToTournament: value,
       },
    });
  }, [tourneyCfg.widgetBracket, updateConfig]);
  const handleBracketChange = useCallback((value) => {
    updateConfig("tournament", {
      widgetBracket: {
          ...tourneyCfg.widgetBracket,
          bracket: value,
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

  const getButtonStyle = getLaunchButtonStyle(isWidgetBracketRunning, false);

  return (
    <PanelTemplate
      themeClasses={themeClasses}
    >
      <div className="grid grid-cols-12 gap-8 items-stretch flex-1 min-h-0">
        <div className="col-span-10 min-h-0">
          <div className={`w-full h-full rounded-[2.5rem] ${themeClasses.button}`}>
            {/* Большая область */}
          </div>
        </div>

        {/* Right part */}
        <div className="col-span-2 flex flex-col h-full">
          <div className="space-y-4">
            <Field
              label={locale.UrlToTournamentLabel+"*"}
              witdh="320"
              icon={Globe}
              onChange={handleTournamentUrlChange}
              value={urlToTournament}
              themeClasses={themeClasses}
            />

            <Field
              variant="select"
              label={locale.ListOfBracketsLabel}
              icon={GitFork}
              onChange={handleBracketChange}
              value={bracket}
              themeClasses={themeClasses}
            />

            <Field
              variant="select"
              label={locale.ListOfThemes}
              icon={Paintbrush}
              onChange={handleThemeBracketChange}
              value={themeBracket}
              themeClasses={themeClasses}
            />
            
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
              // onClick={handleWidgetBracketToggle}
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
