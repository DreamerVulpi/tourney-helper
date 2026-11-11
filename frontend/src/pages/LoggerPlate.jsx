
import { useState, useEffect, useCallback } from "react";
import { Database, FolderOpen, FileUp } from "lucide-react";
import { createLoadLogs } from "../hooks/App/useLogs.jsx";
import { useThemeClasses } from "../hooks/App/useThemeClasses"
import { getThemeClasses } from "../utils/themeClasses";
import { useAppStore } from "../store/useAppStore";
import { OpenLogsFolder, ExportCurrentLog } from "../../wailsjs/go/application/App.js";

const LoggerPlate = ({ locale}) => {
  const theme = useAppStore((s) => s.theme);
  const themeClasses = useThemeClasses(getThemeClasses);

  const [logs, setLogs] = useState([]);
    const loadLogs = useCallback(createLoadLogs(setLogs), []);

    useEffect(() => {
        loadLogs();
        const interval = setInterval(loadLogs, 1000);
        return () => clearInterval(interval);
    }, [loadLogs]);

  const handleOpenLogsFolder = useCallback(() => {
    OpenLogsFolder().catch((e) => {
      console.error("[logs] failed to open folder:", e);
    });
  }, []);

  const handleExportCurrentLog = useCallback(() => {
    ExportCurrentLog().catch((e) => {
      console.error("[logs] failed to export current log:", e);
    });
  }, []);

  return (
    <footer
      className={`h-40 border-t backdrop-blur-xl z-40 overflow-hidden flex flex-col ${
        themeClasses.footer
      }`}
    >
      <div
        className={`h-8 flex items-center px-8 border-b transition-colors duration-300 ${themeClasses.titlebar.base}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="shrink-0 text-blue-500" />
            <span className="text-[9px] font-black uppercase italic tracking-wider text-slate-500 whitespace-nowrap">
              {locale.Label}
            </span>
          </div>
          <div className="h-3 w-px shrink-0 ml-1 bg-slate-500/30" />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenLogsFolder}
              className={`flex shrink-0 items-center justify-center gap-1.5 h-6 px-2 rounded-md text-[9px] font-black uppercase italic tracking-wider whitespace-nowrap text-slate-500 transition-colors ${themeClasses.titlebar.buttonHover}`}
            >
              <FolderOpen size={12} />
              <span>{locale.OpenLogsFolder}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCurrentLog}
              className={`flex shrink-0 items-center justify-center gap-1.5 h-6 px-2 rounded-md text-[9px] font-black uppercase italic tracking-wider whitespace-nowrap text-slate-500 transition-colors ${themeClasses.titlebar.buttonHover}`}
            >
              <FileUp size={12} />
              <span>{locale.ExportCurrentLog}</span>
            </button>
          </div>
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