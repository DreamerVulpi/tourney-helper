import React, { useState } from "react";
import { 
  Trophy, 
  Send,
  Users,
  Monitor,
  ShieldCheck,
  Settings,
  LayoutGrid
} from "lucide-react";

const NavItem = ({ icon, label, active, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group overflow-hidden mb-1 ${
      active 
        ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] scale-[1.02]" 
        : theme === "dark" 
          ? "text-slate-400 hover:bg-white/5 hover:text-white" 
          : "text-slate-600 hover:bg-blue-600/10 hover:text-blue-600"
    }`}
  >
    {/* Активный индикатор (полоска слева) */}
    {active && (
      <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-[2px_0_10px_rgba(255,255,255,0.5)] z-20" />
    )}

    <span className={`relative z-10 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
      {icon}
    </span>
    
    <span className={`relative z-10 hidden lg:block text-[10px] font-black uppercase tracking-[0.1em] text-left leading-tight italic transition-all ${
      active ? "text-white opacity-100" : "opacity-70 group-hover:opacity-100"
    }`}>
      {label}
    </span>

    {/* Эффект блика при наведении для активной кнопки */}
    {active && (
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none animate-pulse" />
    )}
  </button>
);

const SidePanel = ({
  theme = "dark", 
  activeTab, 
  setActiveTab, 
  statusDatabase, 
  statusSender, 
  statusWidgetBracket, 
  statusWidgetScoreboard
}) => {
  const statuses = [
    { label: "Рассылка уведомлений", active: statusSender },
    { label: "База данных игроков", active: statusDatabase },
    { label: "Оверлей турнирной сетки", active: statusWidgetBracket },
    { label: "Оверлей Scoreboard", active: statusWidgetScoreboard }
  ];

  return (
    <nav
      className={`w-20 lg:w-72 border-r flex flex-col p-4 shrink-0 transition-colors duration-500 h-screen ${
        theme === "dark" ? "bg-[#0a0a0a] border-white/5" : "bg-white border-slate-200"
      }`}
    >
      <div className="space-y-1">
        <NavItem
          theme={theme}
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          icon={<Send size={20} />}
          label="Рассылка уведомлений"
        />
        <NavItem
          theme={theme}
          active={activeTab === "database"}
          onClick={() => setActiveTab("database")}
          icon={<Users size={20} />}
          label="База данных игроков"
        />
        <NavItem
          theme={theme}
          active={activeTab === "bracket"}
          onClick={() => setActiveTab("bracket")}
          icon={<Trophy size={20} />}
          label="Виджет сетки"
        />
        <NavItem
          theme={theme}
          active={activeTab === "scoreboard"}
          onClick={() => setActiveTab("scoreboard")}
          icon={<Monitor size={20} />}
          label="Виджет Scoreboard"
        />
      </div>

      Version: 0.3.0
    </nav>
  );
};

export default SidePanel;
