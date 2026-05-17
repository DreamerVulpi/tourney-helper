import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Minus,
  ChevronDown,
  RefreshCcw,
} from "lucide-react";
import { AddParticipant, GetParticipants, EditParticipant, EditParticipantStatsRating } from "../../wailsjs/go/application/App";
import { debounce } from '../hooks/debounce.jsx';
import ParticipantModal from './ParticipantModal.jsx'

const DatabasePlate = ({ theme, statusDatabase}) => {
  const [selectedGame, setSelectedGame] = useState("Tekken8");
  // useEffect(() => {
  //   fetchData(false);
  // }, [selectedGame]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); 
  const [isDragging, setIsDragging] = useState(false);

  const sizeColumnOfNickname = 50
  const sizeColumnOfGameID = 30
  const sizeColumnOfRegion = 10
  const sizeColumnOfLanguage = 10
  const sizeColumnOfMMR = 40
  const sizeColumnOfMMRPoints = 40
  const sizeColumnOfPlatforms = 30
  const sizeColumnOfUpdateDate = 30
  const sizeColumnOfControl = 20
  const sizeColumnOfTypeBan = 50
  const sizeColumnOfDescriptionBan = 150
  
  const [players, setPlayers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const limit = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleOpenEditModal = (participant) => {
      setEditingParticipant(participant); // Кладём данные игрока в стейт
      setIsModalOpen(true);
  };

  const handleSaveParticipant = async (data) => {
      setModalLoading(true);
      try {
        if (editingParticipant) {
          await EditParticipant(
            editingParticipant.id,
            data.nickname,
            data.gameId,
            selectedGame,
            data.region,
            data.locale,
            data.rating,
            data.messenger.platform,
            data.messenger.login,
            data.tournament.platform,
            data.tournament.login
          );
          setIsModalOpen(false);
          await fetchData(false, searchQuery); 
          addLog(`Данные игрока ${data.nickname} успешно изменены`, "success");
        } else {
          await AddParticipant(
            data.nickname,
            data.gameId,
            selectedGame,
            data.region,
            data.locale,
            data.rating,
            data.messenger.platform,
            data.messenger.login,
            data.tournament.platform,
            data.tournament.login
          );
          setIsModalOpen(false);
          await fetchData(false); 
          addLog(`Игрок ${data.nickname} успешно добавлен`, "success");
        }
      } catch (err) {
          console.error(err);
      } finally {
          setModalLoading(false);
      }
  };

  const handleOpenAddModal = () => {
    setEditingParticipant(null); // Очищаем данные, так как мы добавляем нового
    setIsModalOpen(true);
  };

  const handleLocalRatingChange = (participantId, val) => {
  // 1. Мгновенно обновляем цифры в стейте, чтобы пользователь видел ввод
    setPlayers(prev => prev.map(p => 
      (p.id === participantId) 
        ? { ...p, rating: val } 
        : p
    ));

    // 2. Отправляем в "отложенную" очередь на запись в БД
    debouncedRatingUpdate(participantId, val);
  };

  const handleUpdateRating = async (participantId, currentRating, delta) => {
  const newRating = Math.max(0, currentRating + delta);
  
  try {
    await EditParticipantStatsRating(participantId, newRating);
    
    setPlayers(prev => prev.map(p => 
      p.id === participantId ? { ...p, rating: newRating } : p
    ));
    
    addLog(`Рейтинг обновлен до ${newRating}`, "success");
  } catch (err) {
    addLog("Ошибка при обновлении рейтинга", "error");
  }
};

const handleUpdateRatingRef = useRef(handleUpdateRating);
handleUpdateRatingRef.current = handleUpdateRating;

const debouncedRatingUpdate = useMemo(
  () => debounce((participantId, newValue) => {
    handleUpdateRatingRef.current(participantId, 0, newValue);
  }, 600),
  []
);

  const fetchData = async (isNextPage = false, search = "") => {
  setLoading(true);
  try {
    // Используем актуальный offset (переданный или из стейта)
    const currentOffset = isNextPage ? players.length : 0;
    const currentSearch = search || searchQuery || "";
    // TODO: Изменить на переменные
    const response = await GetParticipants("Discord", "Startgg", selectedGame, limit, currentOffset, currentSearch);
    
    if (response && response.items) {
      if (isNextPage) {
        // Добавляем новых в конец списка
        setPlayers(prev => [...prev, ...response.items]);
      } else {
        // Если это первая загрузка или рефреш — заменяем
        setPlayers(response.items);
      }
      setTotalCount(response.totalCount || 0);
    }
  } catch (err) {
    console.error("Ошибка загрузки:", err);
  } finally {
    setLoading(false);
  }
};

const debouncedFetch = useMemo(
  () => debounce((query) => {
    // Вызываем загрузку с первого офсета (0), так как поиск — это новый запрос
    fetchData(false, query); 
  }, 1000),
    [players.length] // Пересоздавать, если нужно, но обычно зависимости пустые []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value); // Мгновенно обновляем текст в инпуте для UX
    debouncedFetch(value); // А запрос в БД пойдет с задержкой
};

const fetchDataRef = useRef(fetchData);
fetchDataRef.current = fetchData;

useEffect(() => {
  const tableContainer = document.getElementById('table-scroll-container');
  if (!tableContainer) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = tableContainer;
    
    if (scrollHeight - scrollTop - clientHeight < 100 && !loading && players.length < totalCount) {
      fetchDataRef.current(true);
    }
  };

  tableContainer.addEventListener('scroll', handleScroll);
  return () => tableContainer.removeEventListener('scroll', handleScroll);
}, [loading, players.length, totalCount]);

  useEffect(() => {
    fetchData(false);
  }, [selectedGame, activeFilter]);

  const addLog = (msg, type) => console.log(`[${type}] ${msg}`);

  const filteredPlayers = useMemo(() => {
  let list = players ? [...players] : [];

  // Фильтрация по статусу или сортировка
  if (activeFilter === "banned") {
    list = list.filter(p => p.status === "banned");
  } else if (activeFilter === "rating") {
    list = list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const query = searchQuery?.toLowerCase().trim() || "";
  if (!query) return list;

  return list.filter(p => {
    // Используем ключи, которые видны в логе консоли
    const nickname = p?.gameNickname?.toLowerCase() || "";
    const region = p?.region?.toLowerCase() || "";
    const gameId = p?.gameId?.toLowerCase() || "";

    return (
      nickname.includes(query) ||
      region.includes(query) ||
      gameId.includes(query)
    );
  });
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

  const getRelativeTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'только что';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин. назад`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  // Добавьте этот лог перед return, чтобы увидеть, что реально лежит в памяти
console.log("Текущие игроки в стейте:", players);
console.log("Игроки после фильтрации:", filteredPlayers);
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
              className="relative min-h-[56px] w-full lg:w-[200px] group shrink-0"
              onMouseEnter={() => setIsAddHovered(true)}
              onMouseLeave={() => setIsAddHovered(false)}
            >
              <div className={`absolute inset-0 flex items-center justify-center bg-blue-600 text-white rounded-xl font-black text-xs uppercase italic transition-all duration-300 z-10 ${isAddHovered ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}>
                <Plus size={18} className="mr-2" /> Добавить
              </div>
              
              <div className={`absolute inset-0 flex gap-0.5 transition-all duration-300 z-20 ${isAddHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                <button 
                  onClick={handleOpenAddModal} // Теперь открывает модалку
                  className="flex-1 bg-blue-700 hover:bg-blue-500 text-white flex flex-col items-center justify-center rounded-l-xl transition-colors"
                >
                  <UserPlus size={14} /> 
                  <span className="text-[7px] font-black uppercase mt-1 text-center">
                    Одного игрока
                  </span>
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
            
            <div className="relative group">
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                disabled={loading}
                className={`appearance-none flex items-center w-[160px] h-[56px] pl-4 pr-10 rounded-xl border transition-all cursor-pointer outline-none text-[11px] font-black uppercase tracking-tight ${
                  theme === 'dark' 
                    ? 'bg-[#121212] border-white/5 text-slate-400 hover:text-blue-500 hover:border-blue-500/50' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="Tekken8" className={`${theme === 'dark' ? 'bg-[#1a1a1a] text-slate-300' : 'bg-white text-slate-900'}`}>
                  Tekken 8
                </option>
                <option value="SF6" className={`${theme === 'dark' ? 'bg-[#1a1a1a] text-slate-300' : 'bg-white text-slate-900'}`}>
                  SF6
                </option>
              </select>

              {/* Контейнер для иконки */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                {loading ? (
                  <RefreshCcw size={14} className="animate-spin text-blue-500" />
                ) : (
                  <ChevronDown 
                    size={16} 
                    className={`transition-colors ${
                      theme === 'dark' ? 'text-slate-600 group-hover:text-blue-500' : 'text-slate-400 group-hover:text-blue-600'
                    }`} 
                  />
                )}
              </div>
            </div>
            <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 h-[56px] ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
              {[
                { id: 'all', label: 'Все', icon: <LayoutGrid size={14}/> },
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
                <th className="p-4" style={{ width: `${sizeColumnOfNickname}px` }}>Никнейм</th>
                <th className="p-4" style={{ width: `${sizeColumnOfGameID}px` }}>Игровой ID</th>
                {activeFilter === 'banned' ? (
                  <>
                    <th className="p-4 text-red-500" style={{ width: `${sizeColumnOfTypeBan}px` }}>Причина бана</th>
                    <th className="p-4 text-amber-500/80" style={{ width: `${sizeColumnOfDescriptionBan}px` }}>Описание нарушения</th>
                    <th className="p-4" style={{ width: `${sizeColumnOfUpdateDate}px` }}>Обновлено</th>
                    <th className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>Управление</th>
                  </>
                ) : (
                  <>
                    <th className="p-4" style={{ width: `${sizeColumnOfRegion}px` }}>Регион</th>
                    <th className="p-4" style={{ width: `${sizeColumnOfLanguage}px` }}>Язык</th>
                    <th className="p-4 text-blue-500" style={{width: `${sizeColumnOfMMR}px`}}>MMR Рейтинг</th>
                    <th className="p-3" style={{ width: `${sizeColumnOfPlatforms}px` }}>Платформы</th>
                    <th className="p-3" style={{ width: `${sizeColumnOfUpdateDate}px` }}>Обновлено</th>
                    <th className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>Управление</th>
                  </>
                )}
              </tr>
            </thead>
          </table>
          </div>
          {/* Table Container */}
          <div id="table-scroll-container" className="overflow-y-auto overflow-x-auto custom-scrollbar" style={{ maxHeight: "27rem" }}>
        <table className="w-full text-left text-[11px] table-fixed min-w-[1100px] border-collapse">
          <tbody className="divide-y divide-white/5">
            {filteredPlayers.map((p) => (
              <tr key={p.id} className="hover:bg-blue-600/5 transition-colors align-middle">
                {/* ВАЖНО: Ширина ячеек (w-[...]) должна точно совпадать с шириной в thead выше */}
                <td className="p-4" style={{ width: `${sizeColumnOfNickname}px` }}>
                  <span className="font-black text-[13px] italic tracking-tight break-all block">{p.gameNickname || p.messenagerLogin || 'N/D'}</span>
                </td>
                
                <td className="p-4" style={{ width: `${sizeColumnOfGameID}px` }}>
                  <span className="font-mono text-slate-500 font-bold block">{p.gameId}</span>
                </td>

                {activeFilter === 'banned' ? (
                  <>
                    <td className="p-4 text-red-500 font-bold italic truncate" style={{ width: `${sizeColumnOfTypeBan}px` }}>{p.banReason}</td>
                    <td className="p-4" style={{ width: `${sizeColumnOfDescriptionBan}px` }}>
                      <div className={`text-[10px] leading-snug opacity-80 whitespace-normal break-words ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {p.violationDetail || "Детальное описание отсутствует."}
                      </div>
                    </td>
                    <td className="p-4 opacity-60 italic whitespace-nowrap" style={{ width: `${sizeColumnOfUpdateDate}px` }}>{getRelativeTime(p.updatedAt)}</td>
                    <td className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>
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
                    <td className="p-4" style={{ width: `${sizeColumnOfRegion}px` }}>
                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                         {p.region}
                       </span>
                    </td>
                    <td className="p-4 font-bold italic opacity-70 uppercase whitespace-nowrap" style={{ width: `${sizeColumnOfLanguage}px` }}>{p.locale}</td>
                    <td className="p-4" style={{ width: `${sizeColumnOfMMR}px` }}>
                      {/* Поле ввода рейтинга */}
                      <input
                        type="number"
                        value={p.rating || 0}
                        min="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val >= 0) {
                            handleLocalRatingChange(p.id, val);
                          }
                        }}
                        className={`bg-transparent text-blue-500 font-black text-sm italic outline-none border-b border-transparent focus:border-blue-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        style={{ width: `${sizeColumnOfMMRPoints}px` }}
                      />

                      <div className="flex gap-1">
                        {/* Кнопка +5 (или 10/20 по вашему выбору) */}
                        <button 
                          onClick={() => handleUpdateRating(p.id, p.rating, 10)}
                          className="w-7 h-7 flex items-center justify-center bg-green-600/10 text-green-500 rounded-lg border border-green-600/20 hover:bg-green-600/20 transition-colors"
                        >
                          <Plus size={12}/>
                        </button>

                        {/* Кнопка -5 */}
                        <button 
                          onClick={() => handleUpdateRating(p.id, p.rating, -10)}
                          className="w-7 h-7 flex items-center justify-center bg-red-600/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-600/20 transition-colors"
                        >
                          <Minus size={12}/>
                        </button>
                      </div>
                    </td>
<td className="p-4" style={{ width: `${sizeColumnOfPlatforms}px` }}>
   <div className="flex flex-col text-[9px] font-bold whitespace-nowrap leading-tight">
      <span className="truncate">{p.tournamentPlatformName}</span>
      {p.tournamentPlatformId && <span className="opacity-40 text-[8px] truncate">ID: {p.tournamentPlatformId}</span>}
      {p.tournamentPlatformLogin && <span className="opacity-40 text-[8px] truncate">Login: {p.tournamentPlatformLogin}</span>}
      <span className="opacity-40 text-[8px] truncate">{p.messenagerName}</span>
   </div>
</td>
                    <td className="p-4 opacity-60 italic text-[10px] whitespace-nowrap" style={{ width: `${sizeColumnOfUpdateDate}px` }}>{getRelativeTime(p.updatedAt)}</td>
                    <td className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>
                      <div className="flex flex-col gap-1.5">
                        <button 
    onClick={() => handleOpenEditModal(p)} // Передаем объект текущего игрока
    className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[8px] font-black uppercase"
>
    <Edit2 size={11}/> Изменить 
</button>
                        <button className="w-full flex items-center justify-center gap-2 p-2 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg text-[8px] font-black uppercase"><Ban size={11}/> Забанить </button>
                        <button className="w-full flex items-center justify-center gap-2 p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[8px] font-black uppercase"><Trash2 size={11}/> Удалить </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Индикатор загрузки внизу */}
        {loading && (
          <div className="p-4 text-center text-[10px] font-black uppercase italic text-amber-500">
            Загрузка участников...
          </div>
        )}
      </div>

          {/* Footer Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase italic px-2">
            <button onClick={() => addLog("Reset All Rating", "warn")} className="flex items-center gap-2 text-red-500/70 hover:text-red-500 transition-colors group">
              <RotateCcw size={12} className="group-hover:rotate-[-180deg] transition-transform duration-500"/> Сброс рейтинга всех игроков
            </button>
            <div className="text-slate-500 bg-blue-600/5 border border-blue-600/10 px-5 py-2.5 rounded-xl">
              <span>Всего игроков в базе данных: <span className="text-blue-500 ml-1">{totalCount}</span></span>
            </div>
          </div>
        </div>
      </div>
      </div>
      <ParticipantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveParticipant} // Функция, которая будет отправлять данные в Go
        initialData={editingParticipant}
        loading={modalLoading}
        theme={theme}
      />
    </div>
  )
}

export default DatabasePlate;