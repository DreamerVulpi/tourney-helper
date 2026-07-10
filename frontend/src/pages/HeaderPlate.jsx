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
import { getThemeClasses } from "../utils/theme/HeaderPlate/themes";
import { createThemeChanger } from "../utils/changeTheme";
import { ExtraButton } from "../components/ui/ExtraButton";
import { DropdownList } from "../components/ui/DropdownList";

const HeaderPlate = ({
  theme,
  setTheme,
  lang,
  setLang,
  locale,
  updateConfig,
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
  const themeClasses = getThemeClasses(theme);

  return (
    <header
      className={`h-[4rem] flex items-center justify-between px-[1.5rem] shrink-0 border-b z-50 transition-colors duration-300 ${
        themeClasses.header
      }`}
    >
      <div className="flex items-center gap-[1.5rem]">
        {/* Logo */}
        {fontStyle}
        <div className="flex items-center gap-[0.4rem] mb-2 mt-2 select-none">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <Trophy size={20} className="text-blue-500" />
          </div>
          <div className="hidden lg:block">
            <span
              className={`font-super-bold italic text-2xl tracking-tighter uppercase ${
                themeClasses.logoTitle
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
        <DropdownList
          value = {lang}
          icon = {LanguagesIcon}
          themeClasses={themeClasses}
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
            themeClasses.themeButton
          }`}
        >
          <div
            className={`p-[0.25rem] rounded-full transition-all ${
              themeClasses.sunIcon
            }`}
          >
            <Sun style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
          <div
            className={`p-[0.25rem] rounded-full transition-all ${
              themeClasses.moonIcon
            }`}
          >
            <Moon style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
        </button>

        {/* Extra buttons */}
        <div
          className={`flex items-center gap-[1rem] pl-[1rem] border-l h-[1.5rem] text-[0.5625rem] font-black uppercase tracking-widest text-slate-500 ${
            themeClasses.divider
          }`}
        >
          <ExtraButton
            icon={HelpCircle}
            label={locale.HelpLabel}
            iconClass="group-hover:rotate-12"
          />

          <ExtraButton
            icon={Info}
            label={locale.AboutLabel}
            iconClass="group-hover:scale-110"
          />
        </div>
      </div>
    </header>
  );
};

export default HeaderPlate;
