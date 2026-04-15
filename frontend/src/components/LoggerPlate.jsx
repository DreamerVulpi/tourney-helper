import React from "react";
import { Database } from "lucide-react";

// Добавляем пропсы: logs, setLogs и theme
const LoggerPlate = ({ logs = [], setLogs, theme }) => {
  return (
    <footer
      className={`h-40 border-t backdrop-blur-xl z-40 overflow-hidden flex flex-col ${
        theme === "dark" 
          ? "bg-[#080808]/90 border-white/5" 
          : "bg-white/95 border-slate-200 shadow-2xl"
      }`}
    >
      <div className="h-8 flex items-center justify-between px-8 border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-2">
          <Database size={12} className="text-blue-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
            Logs
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-slate-500">
            {new Date().toLocaleTimeString()}
          </span>
          <button
            onClick={() => setLogs([])}
            className="text-[8px] font-black uppercase text-slate-600 hover:text-blue-500 transition-colors"
          >
            Очистить
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[10px]">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-20 italic uppercase tracking-[0.3em] text-slate-500">
            No events recorded
          </div>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-in slide-in-from-left-2 duration-300 ${
                l.type === "success" 
                  ? "text-green-500" 
                  : l.type === "error" 
                    ? "text-red-500" 
                    : "text-blue-400"
              }`}
            >
              <span className="opacity-40">[{l.time}]</span>
              <span className="font-bold uppercase">[{l.type}]</span>
              <span
                className={
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
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