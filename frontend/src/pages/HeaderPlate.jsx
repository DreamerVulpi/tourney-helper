import React, { useState } from "react";

import {
  Trophy,
  LanguagesIcon,
  ChevronDown,
  Sun,
  Moon,
  HelpCircle,
  Info,
} from "lucide-react";
import { getThemeClasses } from "../utils/theme/HeaderPlate/themes.jsx";
import { createThemeChanger } from "../utils/changeTheme";
import { ExtraButton } from "../components/ui/ExtraButton";
import { DropdownList } from "../components/ui/DropdownList";
import { Field } from "../components/ui/Field.jsx";
import AboutModal from "../components/modals/AboutModal.jsx"
import HelpModal from "../components/modals/help/HelpModal.jsx"
import UpdateModal from "../components/modals/UpdateModal.jsx"
import Logo from "../../../branding/icons/256.png";

const HeaderPlate = ({
  theme,
  setTheme,
  lang,
  setLang,
  locale,
  updateInfo,
  check,
  updateConfig,
  themeClasses,
  activeModal,
  activeTab,
  setActiveModal,
  settings,
  setSettings,
}) => {
  // Font for logo programm
  const fontStyle = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      .font-super-bold { font-family: 'Inter', sans-serif; font-weight: 900; }
    `}</style>
  );

  // Variable for selector languages
  const [isLangOpen, setIsLangOpen] = useState(false);
  // Function for change theme & save to configuration of programm
  const changeTheme = createThemeChanger(theme, setTheme, updateConfig);
  // Details of theme for this page
  const headerThemeClasses = getThemeClasses(theme);
 
  return (
    <header
      className={`h-[4rem] flex items-center justify-between px-[1.5rem] shrink-0 border-b z-50 transition-colors duration-300 ${
        headerThemeClasses.header
      }`}
    >
      <div className="flex items-center gap-[1.5rem]">
        {/* Logo */}
        {fontStyle}
        <div className="flex items-center gap-[0.4rem] mb-2 mt-2 select-none">
        <div className="p-2 bg-blue-600/10 rounded-lg">
          <img
            src={Logo}
            alt="Tourney Helper"
            className="w-8 h-8 object-contain"
          />
        </div>
          <div className="hidden lg:block">
            <span
              className={`font-super-bold italic text-2xl tracking-tighter uppercase ${
                headerThemeClasses.logoTitle
              }`}
            >
              <span>TOURNEY</span>
              <span className="text-blue-600 ml-[0.rem]">HELPER</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[1rem]">
        {/* Selector language */}
        <Field
        variant="select"
        value={lang}
        width={"6.5rem"}
        icon = {LanguagesIcon}
        themeClasses={headerThemeClasses}
        items={[
            {
              label: "RU",
              value: "RU",
            },
            {
              label: "EN",
              value: "EN",
            }
          ]}
        onChange={(value) => {
            setLang(value);
            updateConfig?.("settings", {
              language: value,
            });
          }}
        />

        {/* Theme switcher */}
        <button
          onClick={changeTheme}
          className={`flex items-center gap-[0.25rem] p-[0.25rem] rounded-full border transition-all duration-300 ${
            headerThemeClasses.themeButton
          }`}
        >
          <div
            className={`p-[0.25rem] rounded-full transition-all ${
              headerThemeClasses.sunIcon
            }`}
          >
            <Sun style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
          <div
            className={`p-[0.25rem] rounded-full transition-all ${
              headerThemeClasses.moonIcon
            }`}
          >
            <Moon style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
        </button>

        {/* Extra buttons */}
        <div
          className={`flex items-center gap-[1rem] pl-[1rem] border-l h-[1.5rem] text-slate-500 ${
            headerThemeClasses.divider
          }`}
        >
          <Field
            variant="button"
            width="100px"
            icon={HelpCircle}
            labelButton={locale.Help.Label}
            themeClasses={themeClasses}
            onClick={()=> setActiveModal("help")}
          />
          <Field
            variant="button"
            icon={Info}
            width="100px"
            labelButton={locale.About.Label}
            themeClasses={themeClasses}
            onClick={()=> setActiveModal("about")}
          />
        </div>
      </div>
    <AboutModal
      isOpen={activeModal === "about"}
      locale={locale.About}
      themeClasses={themeClasses}
      onClose={() => {
          setActiveModal(null);
          setTimeout(() => {
            fetchData(false);
          }, 100);
      }}
      settings={settings}
      updateInfo={updateInfo}
      setActiveModal={setActiveModal}
      check={check}
    />
    <HelpModal
      activeTab={activeTab}
      isOpen={activeModal === "help"}
      locale={locale.Help}
      themeClasses={themeClasses}
      onClose={() => {
          setActiveModal(null);
          setTimeout(() => {
            fetchData(false);
          }, 100);
      }}
    />
    <UpdateModal 
      isOpen={activeModal === "update"}
      locale={locale.Update}
      themeClasses={themeClasses}
      onClose={() => {
          setActiveModal(null);
          setTimeout(() => {
            fetchData(false);
          }, 100);
      }}
      lang={lang}
      updateInfo={updateInfo}
      check={check}
      updateConfig={updateConfig}
      settings={settings}
      setSettings={setSettings}
    />
    </header>
  );
};

export default HeaderPlate;
