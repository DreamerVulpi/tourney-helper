
import { useState, useEffect, useCallback } from "react";
import { Database } from "lucide-react";
import { getThemeClasses } from "../utils/theme/LoggerPlate/themes";
import { createLoadLogs } from "../hooks/App/useLogs.jsx";

const LoggerPlate = ({ theme, locale}) => {
  const themeClasses = getThemeClasses(theme);
  const [logs, setLogs] = useState([]);
    const loadLogs = useCallback(createLoadLogs(setLogs), []);

    useEffect(() => {
        loadLogs();

        const interval = setInterval(loadLogs, 1000);

        return () => clearInterval(interval);
    }, [loadLogs]);

  return (
    <footer
      className={`h-40 border-t backdrop-blur-xl z-40 overflow-hidden flex flex-col ${
        themeClasses.footer
      }`}
    >
      <div className="h-8 flex items-center justify-between px-8 border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-2">
          <Database size={16} style={{ width: "0.875rem", height: "0.875rem", }} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
            {locale.Label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 font-mono text-[10px]">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-20 italic uppercase tracking-[0.3em] text-slate-500">
            {locale.NoLogs}
          </div>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              className={`flex gap-3 slide-in-from-left-2 duration-300 ${
                l.type === "success" 
                  ? "text-green-500" 
                  : l.type === "error" 
                    ? "text-red-500" 
                    : l.type === "warning"
                      ? "text-orange-500"
                       : l.type === "debug"
                        ? "text-amber-500"
                        : "text-blue-400"
              }`}
            >
              <span className={themeClasses.logText}>[{l.time}]</span>
              <span className="font-bold uppercase">[{l.type}]</span>
              <span
                className={
                  themeClasses.logText
                }
              >
                {l.msg}
              </span>
            </div>
          ))
        )}
      </div>
    </footer>
  );
};

export default LoggerPlate;