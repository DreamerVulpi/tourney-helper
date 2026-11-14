import {
  Minus,
  Square,
  X,
} from "lucide-react";

import {
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
} from "../../wailsjs/runtime/runtime";
import { useThemeClasses } from "../hooks/App/useThemeClasses";
import { getThemeClasses } from "../utils/themeClasses"; 
import { ProgramLogo } from "./ui/Logo";

export default function WindowTitleBar() {
  const themeClasses = useThemeClasses(getThemeClasses);
  
  // Безопасное получение классов шапки (на случай если их еще нет в конфиге)
  const tbClasses = themeClasses?.titlebar || {
    base: "bg-[#0f172a] text-slate-400 border-slate-800",
    buttonHover: "hover:bg-white/10 hover:text-white",
    closeHover: "hover:bg-red-500 hover:text-white",
  };

  return (
    <header className={`window-titlebar flex justify-between items-center h-[32px] select-none border-b z-50 transition-colors duration-300 ${tbClasses.base}`}>
      
      <div className="window-titlebar__drag flex-grow h-full flex items-center pl-3">
        <ProgramLogo
            theme={themeClasses}
            collapsed={false}
        />
      </div>

      <div className="window-titlebar__controls flex h-full --wails-draggable-no-drag">
        <button
          type="button"
          onClick={WindowMinimise}
          className={`w-[46px] h-full flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors duration-200 ${tbClasses.buttonHover}`}
        >
          <Minus size={16} />
        </button>

        <button
          type="button"
          onClick={WindowToggleMaximise}
          className={`w-[46px] h-full flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors duration-200 ${tbClasses.buttonHover}`}
        >
          <Square size={14} />
        </button>

        <button
          type="button"
          onClick={Quit}
          className={`w-[46px] h-full flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors duration-200 ${tbClasses.closeHover}`}
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}