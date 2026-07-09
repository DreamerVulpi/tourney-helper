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

const AuthIndicator = ({ label, active }) => (
  <div className={`
    flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-300
    ${active 
      ? "bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
      : "bg-red-500/10 border-red-500/20 text-red-500/70"
    }
  `}>
    <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
    <span className="text-[10px] font-black uppercase tracking-widest bold">{label}</span>
  </div>
);

const HeaderPlate = ({theme, setTheme, lang, setLang, locale, updateConfig}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);

  const fontStyle = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      .font-super-bold { font-family: 'Inter', sans-serif; font-weight: 900; }
    `}</style>
  );

  return (
    <header
      className={`h-[4rem] flex items-center justify-between px-[1.5rem] shrink-0 border-b z-50 transition-colors duration-300 ${
        theme === "dark" ? "bg-[#0a0a0a] border-white/5" : "bg-white border-slate-200"
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
          <span className={`font-super-bold italic text-2xl tracking-tighter uppercase ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <span>TOURNEY</span>
            <span className="text-blue-600 ml-[0.rem]">HELPER</span>
          </span>
        </div>
      </div>
      </div>

      <div className="flex items-center gap-[1rem]">
        {/* Selector language */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`flex items-center gap-[0.5rem] px-[0.625rem] h-[2rem] rounded-[0.5rem] border text-[0.625rem] font-bold uppercase tracking-widest transition-all ${
              theme === "dark"
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200"
            }`}
          >
            <LanguagesIcon
              style={{ width: "0.875rem", height: "0.875rem" }}
              className="text-blue-600"
            />
            <span className="leading-none">{lang}</span>
            <ChevronDown
              style={{ width: "0.75rem", height: "0.75rem" }}
              className="opacity-50"
            />
          </button>

          {isLangOpen && (
            <div className={`absolute right-0 mt-[0.5rem] w-[7rem] border rounded-[0.5rem] shadow-xl py-[0.25rem] z-[100] ${
              theme === "dark" ? "bg-[#121212] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
              {["RU", "EN"].map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    if (updateConfig) {
                      updateConfig("settings", { language: l, });
                    }
                    setIsLangOpen(false);
                  }}
                  className="w-full text-left px-[1rem] py-[0.45rem] text-[0.625rem] font-bold hover:bg-blue-600 hover:text-white transition-colors uppercase"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`flex items-center gap-[0.25rem] p-[0.25rem] rounded-full border transition-all duration-300 ${
            theme === "dark"
              ? "bg-white/5 border-white/10"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          <div
            className={`p-[0.25rem] rounded-full transition-all ${
              theme === "light"
                ? "bg-white shadow-sm text-amber-500 scale-110"
                : "text-slate-500"
            }`}
          >
            <Sun style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
          <div
            className={`p-[0.25rem] rounded-full transition-all ${
              theme === "dark"
                ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/20"
                : "text-slate-400"
            }`}
          >
            <Moon style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
        </button>

        <div
          className={`flex items-center gap-[1rem] pl-[1rem] border-l h-[1.5rem] text-[0.5625rem] font-black uppercase tracking-widest text-slate-500 ${
            theme === "dark" ? "border-white/10" : "border-slate-200"
          }`}
        >
          <button className="hover:text-blue-500 transition-colors flex items-center gap-[0.25rem] group">
            <HelpCircle
              style={{ width: "0.875rem", height: "0.875rem" }}
              className="group-hover:rotate-12 transition-transform"
            />
            <span className="translate-y-[0.05rem]">{locale.HelpLabel}</span>
          </button>
          <button className="hover:text-blue-500 transition-colors flex items-center gap-[0.25rem] group">
            <Info
              style={{ width: "0.875rem", height: "0.875rem" }}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="translate-y-[0.05rem]">{locale.AboutLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderPlate;