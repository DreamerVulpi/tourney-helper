import React, { useState } from "react";
import {
  Monitor,
  Copy,
  Square,
  Play,
  RotateCcw,
  Eye,
  FileCode,
  Save,
  Wrench // Иконка для WIP
} from "lucide-react";

// Вспомогательные компоненты (предполагается, что они есть в проекте)
const SbField = ({ label, value, onChange, inputClasses, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase italic px-1">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl p-3 text-xs border font-bold outline-none transition-all focus:border-blue-500/50 ${inputClasses}`}
    />
  </div>
);

const ControlPad = ({ name, score, color, onPlus, onMinus, cardClasses }) => (
  <div className={`p-4 rounded-2xl border flex flex-col items-center gap-3 ${cardClasses}`}>
    <span className="text-[10px] font-black uppercase italic text-slate-500">{name}</span>
    <div className={`text-4xl font-black italic ${color === "blue" ? "text-blue-500" : "text-red-500"}`}>
      {score}
    </div>
    <div className="flex gap-2 w-full">
      <button onClick={onMinus} className="flex-1 py-2 bg-slate-500/10 hover:bg-slate-500/20 rounded-lg transition-colors">-</button>
      <button onClick={onPlus} className="flex-1 py-2 bg-slate-500/10 hover:bg-slate-500/20 rounded-lg transition-colors">+</button>
    </div>
  </div>
);

const WidgetScoreboardPlate = ({ theme, addLog }) => {
  // Состояния
  const [isScoreboardOverlayActive, setIsScoreboardOverlayActive] = useState(false);
  const [sbConfig, setSbConfig] = useState({
    p1Name: "PLAYER 1",
    p2Name: "PLAYER 2",
    p1Score: 0,
    p2Score: 0,
    p1Flag: "US",
    p2Flag: "JP",
    event: "GRAND FINALS",
    format: "BO5",
    showFlags: true,
    background: "",
    showDesignTools: false
  });

  // Логика WIP (можешь переключить в false, когда закончишь)
  const isWip = true; 
  const isDark = theme === "dark";

  // Стили
  const inputClasses = isDark 
    ? "bg-black/20 border-white/10 text-white placeholder:text-white/20" 
    : "bg-white border-slate-200 text-slate-700";
    
  const cardClasses = isDark 
    ? "bg-[#111] border-white/5" 
    : "bg-white border-slate-100 shadow-sm";

  return (
    <div className="relative w-full h-full min-h-[600px]">
      
      {/* --- LAYER 1: WIP OVERLAY --- */}
      {isWip && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/40 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
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
                Scoreboard Editor Under Development
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- LAYER 2: MAIN CONTENT --- */}
      <div className={`grid grid-cols-12 gap-8 transition-all duration-700 ${isWip ? "blur-xl grayscale opacity-40 pointer-events-none scale-[0.98]" : "opacity-100"}`}>
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* URL Виджета */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? "bg-blue-600/5 border-blue-600/20" : "bg-blue-50 border-blue-100"}`}>
            <div className="flex items-center gap-3">
              <Monitor size={16} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase italic text-blue-500">
                Scoreboard OBS URL
              </span>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value="http://localhost:3000/widgets/scoreboard/live"
                className={`w-80 rounded-xl px-4 py-2 text-[10px] font-mono border italic outline-none ${inputClasses}`}
              />
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* КНОПКА ВКЛ/ВЫКЛ ОВЕРЛЕЙ */}
          <button
            onClick={() => {
              const newState = !isScoreboardOverlayActive;
              setIsScoreboardOverlayActive(newState);
              if (addLog) addLog(newState ? "Scoreboard выведен на экран" : "Scoreboard скрыт", newState ? "success" : "info");
            }}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase italic text-xs transition-all duration-300 ${
              isScoreboardOverlayActive
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20 ring-4 ring-red-500/10"
                : "bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-500"
            }`}
          >
            {isScoreboardOverlayActive ? <Square size={18} /> : <Play size={18} />}
            {isScoreboardOverlayActive ? "Выключить Scoreboard" : "Включить Scoreboard"}
          </button>

          {/* ПРЕВЬЮ */}
          <div
            className={`aspect-video rounded-[3rem] border-8 relative overflow-hidden flex items-center justify-center transition-all ${isDark ? "bg-black border-white/5" : "bg-slate-300 border-white shadow-2xl"}`}
            style={{
              backgroundImage: sbConfig.background ? `url(${sbConfig.background})` : "none",
              backgroundSize: "cover",
            }}
          >
            <div className="w-[90%] h-24 bg-gradient-to-r from-blue-900 via-black to-red-900 border-y-2 border-blue-500/30 flex items-center px-10 justify-between">
              <div className="flex items-center gap-4">
                {sbConfig.showFlags && (
                  <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-tighter">
                    {sbConfig.p1Flag}
                  </div>
                )}
                <span className="text-3xl font-black italic uppercase text-white tracking-tighter">
                  {sbConfig.p1Name}
                </span>
              </div>
              <div className="flex items-center gap-6 text-5xl font-black italic text-white bg-black/50 px-6 py-2 rounded-xl">
                <span className="text-blue-500">{sbConfig.p1Score}</span>
                <div className="w-px h-10 bg-white/20" />
                <span className="text-red-500">{sbConfig.p2Score}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black italic uppercase text-white tracking-tighter text-right">
                  {sbConfig.p2Name}
                </span>
                {sbConfig.showFlags && (
                  <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-tighter">
                    {sbConfig.p2Flag}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-10 px-6 py-1 bg-blue-600 text-white font-black italic uppercase text-[10px] tracking-widest rounded-full shadow-lg">
              {sbConfig.event} • {sbConfig.format}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <ControlPad
              name={sbConfig.p1Name}
              score={sbConfig.p1Score}
              color="blue"
              onPlus={() => setSbConfig({ ...sbConfig, p1Score: sbConfig.p1Score + 1 })}
              onMinus={() => setSbConfig({ ...sbConfig, p1Score: Math.max(0, sbConfig.p1Score - 1) })}
              cardClasses={cardClasses}
            />
            <ControlPad
              name={sbConfig.p2Name}
              score={sbConfig.p2Score}
              color="red"
              onPlus={() => setSbConfig({ ...sbConfig, p2Score: sbConfig.p2Score + 1 })}
              onMinus={() => setSbConfig({ ...sbConfig, p2Score: Math.max(0, sbConfig.p2Score - 1) })}
              cardClasses={cardClasses}
            />
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ НАСТРОЕК */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section className={`p-6 rounded-[2rem] border space-y-4 ${cardClasses}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic border-b border-white/5 pb-3">
              Данные матча
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <SbField label="Player 1" value={sbConfig.p1Name} onChange={(v) => setSbConfig({ ...sbConfig, p1Name: v })} inputClasses={inputClasses} />
              <SbField label="Player 2" value={sbConfig.p2Name} onChange={(v) => setSbConfig({ ...sbConfig, p2Name: v })} inputClasses={inputClasses} />
              <SbField label="Score 1" type="number" value={sbConfig.p1Score} onChange={(v) => setSbConfig({ ...sbConfig, p1Score: parseInt(v) || 0 })} inputClasses={inputClasses} />
              <SbField label="Score 2" type="number" value={sbConfig.p2Score} onChange={(v) => setSbConfig({ ...sbConfig, p2Score: parseInt(v) || 0 })} inputClasses={inputClasses} />
              <div className="col-span-2 space-y-3">
                <SbField label="Название события" value={sbConfig.event} onChange={(v) => setSbConfig({ ...sbConfig, event: v })} inputClasses={inputClasses} />
                <SbField label="Формат" value={sbConfig.format} onChange={(v) => setSbConfig({ ...sbConfig, format: v })} inputClasses={inputClasses} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20">
              <span className="text-[9px] font-black uppercase text-slate-500 italic">Показывать флаги</span>
              <button
                onClick={() => setSbConfig({ ...sbConfig, showFlags: !sbConfig.showFlags })}
                className={`w-8 h-4 rounded-full relative transition-colors ${sbConfig.showFlags ? "bg-blue-600" : "bg-slate-600"}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${sbConfig.showFlags ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => setSbConfig({ ...sbConfig, p1Score: 0, p2Score: 0 })}
                className="w-full py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2 hover:bg-red-600/20 transition-all"
              >
                <RotateCcw size={14} /> Reset Match
              </button>
              <button
                onClick={() => setSbConfig({ ...sbConfig, showDesignTools: !sbConfig.showDesignTools })}
                className={`w-full py-3 rounded-xl font-black text-[10px] uppercase italic border ${inputClasses} flex items-center justify-center gap-2`}
              >
                {sbConfig.showDesignTools ? <Eye size={14} /> : <FileCode size={14} />} {sbConfig.showDesignTools ? "Скрыть редактор" : "Дизайн (HTML/CSS)"}
              </button>
            </div>
          </section>

          {sbConfig.showDesignTools && (
            <section className={`p-6 rounded-[2rem] border space-y-4 animate-in slide-in-from-right-4 duration-300 ${cardClasses}`}>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-green-500 italic border-b border-white/5 pb-2">
                Custom Theme Engine
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase italic">Background URL</label>
                  <input type="text" placeholder="URL..." className={`w-full p-2 text-[10px] rounded-lg border ${inputClasses}`} onChange={(e) => setSbConfig({ ...sbConfig, background: e.target.value })} />
                </div>
                <textarea placeholder="Custom CSS..." className={`w-full h-24 p-3 text-[10px] font-mono border rounded-lg resize-none outline-none ${inputClasses}`} />
                <button className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                  <Save size={14} /> Сохранить
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetScoreboardPlate;