import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  UserPlus,
  FileUp,
  ExternalLink,
  LayoutGrid,
  Trophy,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Edit2,
  Ban,
  RotateCcw,
  Minus
} from "lucide-react";

const DatabasePlate = ({ theme, statusDatabase }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); 
  const [isDragging, setIsDragging] = useState(false);

  const [players, setPlayers] = useState([
    { 
      gameId: "#88219-XQ-2024", 
      gamertag: "Arslan_Ash_Tekken_King_Prime", 
      region: "PK", 
      rating: 1950, 
      lang: "EN/UR", 
      platformTournament: "Start.gg", 
      platformMessenger: "Discord", 
      updated: "20.03.2024", 
      status: "active" 
    },
    { 
      gameId: "#10293-KR-9912", 
      gamertag: "Knee_The_Legendary_Dragon", 
      region: "KR", 
      rating: 1920, 
      lang: "KR/EN", 
      platformTournament: "Start.gg", 
      platformMessenger: "Discord", 
      updated: "21.03.2024", 
      status: "active" 
    },
    { 
      gameId: "#55601-EU-BAN", 
      gamertag: "ToxicPlayer99", 
      region: "EU", 
      rating: 1200, 
      lang: "RU/EN", 
      platformTournament: "Challonge", 
      platformMessenger: "Telegram", 
      updated: "10.03.2024", 
      status: "banned", 
      banReason: "Multi-accounting",
      violationDetail: "Использование 3-х дополнительных аккаунтов для участия в квалификациях СНГ региона. Повторное нарушение регламента турнира в части честной игры."
    },
    { 
      gameId: "#22384-US-CHE", 
      gamertag: "Cheater_01_Invisible_Hand", 
      region: "US", 
      rating: 2100, 
      lang: "EN", 
      platformTournament: "Start.gg", 
      platformMessenger: "Discord", 
      updated: "22.03.2024", 
      status: "banned", 
      banReason: "Macro usage",
      violationDetail: "Автоматизация комбо-цепочек персонажа Kazuya. Подтверждено анализом логов ввода в матче полуфинала верхней сетки."
    },
    { 
      gameId: "#22384-US-CHE", 
      gamertag: "Cheater_02_Invisible_Hand", 
      region: "JP", 
      rating: 4444, 
      lang: "JA", 
      platformTournament: "Start.gg", 
      platformMessenger: "Discord", 
      updated: "22.03.2026", 
      status: "banned", 
      banReason: "Macro usage",
      violationDetail: "Автоматизация комбо-цепочек персонажа Kazuya. Подтверждено анализом логов ввода в матче полуфинала верхней сетки."
    },
    { 
      gameId: "#22384-US-CHE", 
      gamertag: "Cheater_02_Invisible_Hand", 
      region: "JP", 
      rating: 4444, 
      lang: "JA", 
      platformTournament: "Start.gg", 
      platformMessenger: "Discord", 
      updated: "22.03.2026", 
      status: "banned", 
      banReason: "Macro usage",
      violationDetail: "Автоматизация комбо-цепочек персонажа Kazuya. Подтверждено анализом логов ввода в матче полуфинала верхней сетки."
    },
  ]);

  const addLog = (msg, type) => console.log(`[${type}] ${msg}`);

  const filteredPlayers = useMemo(() => {
    let list = [...players];
    if (activeFilter === "banned") {
      list = list.filter(p => p.status === "banned");
    } else if (activeFilter === "rating") {
      list = list.sort((a, b) => b.rating - a.rating);
    }
    
    return list.filter(p => 
      p.gamertag.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gameId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, searchQuery, activeFilter]);

  const themeClasses = theme === "dark" 
    ? "bg-[#050505] text-white border-white/5" 
    : "bg-slate-50 text-slate-900 border-slate-200";

  const cardClasses = theme === "dark" 
    ? "bg-[#0A0A0A]" 
    : "bg-white shadow-sm";

  const scrollbarStyles = (
    <style>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #3b82f6;
      }
    `}</style>
  );

  return (
    <div className={`min-h-screen p-4 md:p-8 lg:p-1 transition-all font-sans ${themeClasses}`}>
      {/* Стили для кастомного ползунка (Scrollbar) */}
      <style>{`
        /* Скрываем стандартный скроллбар для всего документа */
        window::-webkit-scrollbar, 
        body::-webkit-scrollbar {
          display: none;
        }
        
        body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Настройка вашего кастомного скроллбара */
        .custom-scrollbar {
          overflow-y: auto;
          scrollbar-color: rgba(59, 130, 246, 0.5) transparent; /* Firefox */
          scrollbar-width: thin; /* Firefox */
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          margin-block: 10px; /* Отступы сверху и снизу */
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.6);
        }
      `}</style>
      <div className={`w-full max-w-[100rem] max-h-[70vh] rounded-[40px] border border-white/5 p-8 lg:p-12 flex flex-col space-y-10 transition-all duration-500 ${
        theme === "dark" ? "bg-[#0A0A0A] shadow-2xl" : "bg-white shadow-xl"
      }`}>
        <div className="max-w-[100rem] max-auto space-y-6">
        <div className="space-y-4">
          {/* Main Action Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
            <div
              className="relative min-h-[56px] w-full lg:w-[280px] group shrink-0"
              onMouseEnter={() => setIsAddHovered(true)}
              onMouseLeave={() => setIsAddHovered(false)}
            >
              <div className={`absolute inset-0 flex items-center justify-center bg-blue-600 text-white rounded-xl font-black text-xs uppercase italic transition-all duration-300 z-10 ${isAddHovered ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}>
                <Plus size={18} className="mr-2" /> Добавить
              </div>
              
              <div className={`absolute inset-0 flex gap-0.5 transition-all duration-300 z-20 ${isAddHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                <button onClick={() => addLog("Одного", "info")} className="flex-1 bg-blue-700 hover:bg-blue-500 text-white flex flex-col items-center justify-center rounded-l-xl transition-colors">
                  <UserPlus size={14} /> <span className="text-[7px] font-black uppercase mt-1 text-center">Одного игрока</span>
                </button>
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); addLog("Файл загружен", "success"); }}
                  className={`flex-[1.4] flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer ${
                    isDragging ? 'bg-blue-500 border-white' : 'bg-blue-800/40 border-blue-400/30 hover:bg-blue-700/50'
                  } text-white`}
                >
                  <FileUp size={14} className={isDragging ? 'animate-bounce' : ''} />
                  <span className="text-[7px] font-black uppercase mt-1 text-center px-1 leading-tight">Загрузить (.json)</span>
                </div>
                <button onClick={() => addLog("EWGF", "success")} className="flex-1 bg-blue-700 hover:bg-blue-500 text-white flex flex-col items-center justify-center rounded-r-xl transition-colors">
                  <ExternalLink size={14} /> <span className="text-[7px] font-black uppercase mt-1">ewgf.gg</span>
                </button>
              </div>
            </div>

            <div className="flex-1 relative w-full lg:w-auto">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Поиск по нику, ID или региону..."
                className={`w-full pl-12 pr-6 h-[56px] rounded-xl border text-[12px] font-bold outline-none transition-all focus:ring-2 focus:ring-blue-600/20 ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 h-[56px] ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
              {[
                { id: 'all', label: 'Все игроки', icon: <LayoutGrid size={14}/> },
                { id: 'rating', label: 'Рейтинг', icon: <Trophy size={14}/> },
                { id: 'banned', label: 'Забаненные', icon: <ShieldAlert size={14}/> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-2 px-4 h-full rounded-lg text-[10px] font-black uppercase italic transition-all whitespace-nowrap ${
                    activeFilter === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-blue-500'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${theme === "dark" ? "bg-[#111]" : "bg-slate-100"} border-b border-white/5 overflow-x-auto hide-scrollbar`}>
          <table className="w-full text-left text-[11px] table-fixed min-w-[1100px]">
            <thead>
              <tr className={`${theme === "dark" ? "text-slate-400" : "text-slate-600"} uppercase font-black italic`}>
                <th className="p-4 w-[160px]">Никнейм</th>
                <th className="p-4 w-[130px]">Игровой ID</th>
                {activeFilter === 'banned' ? (
                  <>
                    <th className="p-4 w-[130px] text-red-500">Причина бана</th>
                    <th className="p-4 w-[350px] text-amber-500/80">Описание нарушения</th>
                    <th className="p-4 w-[90px]">Обновлено</th>
                    <th className="p-4 w-[130px]">Управление</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 w-[75px]">Регион</th>
                    <th className="p-4 w-[75px]">Язык</th>
                    <th className="p-4 text-blue-500 w-[140px]">MMR Рейтинг</th>
                    <th className="p-4 w-[100px]">Платформы</th>
                    <th className="p-4 w-[85px]">Обновлено</th>
                    <th className="p-4 w-[140px]">Управление</th>
                  </>
                )}
              </tr>
            </thead>
          </table>
          </div>

          {/* Table Container */}
          <div className="overflow-y-auto overflow-x-auto custom-scrollbar" style={{ maxHeight: "27rem" }}>
        <table className="w-full text-left text-[11px] table-fixed min-w-[1100px] border-collapse">
          <tbody className="divide-y divide-white/5">
            {filteredPlayers.map((p) => (
              <tr key={p.id} className="hover:bg-blue-600/5 transition-colors align-middle">
                {/* ВАЖНО: Ширина ячеек (w-[...]) должна точно совпадать с шириной в thead выше */}
                <td className="p-4 w-[160px]">
                  <span className="font-black text-[13px] italic uppercase tracking-tight break-all block">{p.gamertag}</span>
                </td>
                
                <td className="p-4 w-[130px]">
                  <span className="font-mono text-slate-500 font-bold block">{p.gameId}</span>
                </td>

                {activeFilter === 'banned' ? (
                  <>
                    <td className="p-4 w-[130px] text-red-500 font-bold italic truncate">{p.banReason}</td>
                    <td className="p-4 w-[350px]">
                      <div className={`text-[10px] leading-snug opacity-80 whitespace-normal break-words ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {p.violationDetail || "Детальное описание отсутствует."}
                      </div>
                    </td>
                    <td className="p-4 w-[90px] opacity-60 italic whitespace-nowrap">{p.updated}</td>
                    <td className="p-4 w-[130px]">
                      <div className="flex flex-col gap-1.5 py-2">
                         <button className="flex items-center justify-center gap-1.5 px-2 py-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-lg font-black uppercase text-[8px] transition-all w-full">
                           <ShieldCheck size={11} /> Разбанить
                         </button>
                         <button className="flex items-center justify-center gap-1.5 px-2 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg font-black uppercase text-[8px] transition-all w-full">
                           <Trash2 size={11} /> Удалить
                         </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 w-[75px]">
                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                         {p.region}
                       </span>
                    </td>
                    <td className="p-4 w-[75px] font-bold italic opacity-70 uppercase whitespace-nowrap">{p.lang}</td>
                    <td className="p-4 w-[140px]">
                      <div className="flex items-center gap-3">
                        <span className="text-blue-500 font-black text-sm italic min-w-[35px] text-center">{p.rating}</span>
                        <div className="flex gap-1">
                          <button className="w-7 h-7 flex items-center justify-center bg-green-600/10 text-green-500 rounded-lg border border-green-600/20"><Plus size={12}/></button>
                          <button className="w-7 h-7 flex items-center justify-center bg-red-600/10 text-red-500 rounded-lg border border-red-500/20"><Minus size={12}/></button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 w-[100px]">
                       <div className="flex flex-col text-[9px] font-bold whitespace-nowrap leading-tight">
                         <span className="truncate">{p.platformTournament}</span>
                         <span className="opacity-40 text-[8px] truncate">{p.platformMessenger}</span>
                       </div>
                    </td>
                    <td className="p-4 w-[85px] opacity-60 italic text-[10px] whitespace-nowrap">{p.updated}</td>
                    <td className="p-4 w-[140px]">
                      <div className="flex flex-row gap-1.5 py-3">
                        <button className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[8px] font-black uppercase"><Edit2 size={11}/> </button>
                        <button className="w-full flex items-center justify-center gap-2 p-2 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg text-[8px] font-black uppercase"><Ban size={11}/> </button>
                        <button className="w-full flex items-center justify-center gap-2 p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[8px] font-black uppercase"><Trash2 size={11}/> </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

          {/* Footer Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase italic px-2">
            <button onClick={() => addLog("Reset All Rating", "warn")} className="flex items-center gap-2 text-red-500/70 hover:text-red-500 transition-colors group">
              <RotateCcw size={12} className="group-hover:rotate-[-180deg] transition-transform duration-500"/> Сброс рейтинга всех игроков
            </button>
            <div className="text-slate-500 bg-blue-600/5 border border-blue-600/10 px-5 py-2.5 rounded-xl">
              <span>Всего игроков в базе данных: <span className="text-blue-500 ml-1">{players.length}</span></span>
            </div>
          </div>
        </div>
      </div>
      </div>
      
    </div>
  )
}

export default DatabasePlate;