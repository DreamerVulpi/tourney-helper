import React, { useState } from "react";
import {
  Trophy,
  RefreshCw,
  Copy,
  Play,
  Square,
  FileCode,
  Link as LinkIcon,
  Monitor,
  Wrench // Добавил иконку для WIP
} from "lucide-react";

const SbField = ({ label, value, onChange, inputClasses }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase italic px-1">
      {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl p-3 text-xs border font-bold outline-none transition-all focus:border-blue-500/50 ${inputClasses}`}
    />
  </div>
);

const WidgetBracketPlate = ({ theme, addLog }) => {
  const [isGridOverlayActive, setIsGridOverlayActive] = useState(false);
  const [bracketUrl, setBracketUrl] = useState("https://start.gg/tournament/...");
  
  // Состояние для отображения WIP (можешь завязать на пропс или логику)
  const isWip = true; 
  const isDark = theme === "dark";

  const inputClasses = isDark 
    ? "bg-black/20 border-white/10 text-white placeholder:text-white/20" 
    : "bg-white border-slate-200 text-slate-700";
    
  const cardClasses = isDark 
    ? "bg-[#111] border-white/5" 
    : "bg-white border-slate-100 shadow-sm";

  const copyToClipboard = () => {
    const url = "http://localhost:3000/widgets/bracket/live";
    navigator.clipboard.writeText(url);
    if (addLog) addLog("URL скопирован в буфер обмена", "success");
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* 1. LAYER: WIP OVERLAY */}
      {isWip && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/40 rounded-[2.5rem] animate-in fade-in zoom-in duration-500 pointer-events-auto">
          <div className={`flex flex-col items-center gap-4 p-12 rounded-[3rem] border shadow-2xl ${isDark ? "bg-[#0a0a0a]/90 border-white/10" : "bg-white/90 border-slate-200"}`}>
            <div className="relative">
               <Wrench size={40} className="text-blue-500 animate-bounce" />
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <h2 className={`text-7xl font-black uppercase tracking-tighter italic ${isDark ? "text-white" : "text-slate-900"}`}>
                WIP
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 italic">
                Widget bracket in development
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. LAYER: MAIN CONTENT */}
      <div className={`grid grid-cols-12 gap-8 transition-all duration-700 ${isWip ? "blur-xl grayscale opacity-40 pointer-events-none scale-[0.98]" : "opacity-100"}`}>
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* URL Виджета */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? "bg-blue-600/5 border-blue-600/20" : "bg-blue-50 border-blue-100"}`}>
            <div className="flex items-center gap-3">
              <LinkIcon size={16} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase italic text-blue-500">
                OBS Bracket Widget URL
              </span>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value="http://localhost:3000/widgets/bracket/live"
                className={`w-64 lg:w-80 rounded-xl px-4 py-2 text-[10px] font-mono border italic outline-none ${inputClasses}`}
              />
              <button 
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* КНОПКА ВКЛ/ВЫКЛ ОВЕРЛЕЙ */}
          <button
            onClick={() => {
              const newState = !isGridOverlayActive;
              setIsGridOverlayActive(newState);
              if (addLog) {
                addLog(
                  newState ? "Оверлей сетки активирован" : "Оверлей сетки выключен",
                  newState ? "success" : "info"
                );
              }
            }}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase italic text-xs transition-all duration-300 ${
              isGridOverlayActive
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20 ring-4 ring-red-500/10"
                : "bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-500"
            }`}
          >
            {isGridOverlayActive ? <Square size={18} /> : <Play size={18} />}
            {isGridOverlayActive ? "Выключить оверлей" : "Включить оверлей"}
          </button>

          {/* ПРЕВЬЮ */}
          <div className={`aspect-video rounded-[2.5rem] border-4 flex flex-col items-center justify-center relative transition-colors ${isDark ? "bg-black border-white/5" : "bg-slate-100 border-white shadow-xl"}`}>
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                LIVE PREVIEW (Updating every 2m)
              </span>
            </div>
            <Trophy size={48} className={`${isDark ? "text-white/10" : "text-slate-300"} mb-4`} />
            <span className={`${isDark ? "text-white/20" : "text-slate-400"} text-xs font-black uppercase italic`}>
              [ Tournament Bracket Visualization ]
            </span>
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ НАСТРОЕК */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section className={`p-6 rounded-[2rem] border space-y-5 ${cardClasses}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic border-b border-white/5 pb-3 flex items-center gap-2">
              <Monitor size={14} /> Настройка Виджета
            </h3>
            
            <SbField
              label="URL Турнирной сетки"
              value={bracketUrl}
              onChange={setBracketUrl}
              inputClasses={inputClasses}
            />

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase italic px-1">
                Выбор Турнира (Start.gg)
              </label>
              <select className={`w-full rounded-xl p-3 text-xs border font-bold outline-none appearance-none ${inputClasses}`}>
                <option>EVO 2024</option>
                <option>TWT Finals</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase italic px-1">
                Выбор Пула / Сетки
              </label>
              <select className={`w-full rounded-xl p-3 text-xs border font-bold outline-none appearance-none ${inputClasses}`}>
                <option>Pool A1</option>
                <option>Pool A2</option>
                <option>Top 8</option>
              </select>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2 transition-transform active:scale-95">
                <RefreshCw size={14} /> Обновить виджет
              </button>
              <button className={`w-full py-3 rounded-xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2 border transition-all hover:bg-white/5 ${inputClasses}`}>
                <FileCode size={14} /> Редактировать CSS
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WidgetBracketPlate;