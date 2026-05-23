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
  SearchX,
} from "lucide-react";
import {
  AddParticipant,
  GetParticipants,
  GetBanned,
  EditParticipant,
  EditParticipantStatsRating,
  AddBanToParticipant,
  DelBanFromParticipant,
  DelParticipant,
  ResetRaiting,
} from "../../wailsjs/go/application/App";
import { debounce } from "../hooks/debounce.jsx";
import ImportJsonModal from './ImportJsonModal.jsx';
import ParticipantModal from "./ParticipantModal.jsx";
import ParticipantActionModal from "./ParticipantActionModal.jsx";

const DatabasePlate = ({ theme, statusDatabase }) => {
  const [selectedGame, setSelectedGame] = useState("Tekken8");

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Имена платформ для бэкенда
  const nameMessengerPlatform = "Discord";
  const nameTournamentPlatform = "Startgg";

  const sizeColumnOfNickname = 50;
  const sizeColumnOfGameID = 30;
  const sizeColumnOfRegion = 10;
  const sizeColumnOfLanguage = 10;
  const sizeColumnOfMMR = 40;
  const sizeColumnOfMMRPoints = 40;
  const sizeColumnOfPlatforms = 30;
  const sizeColumnOfUpdateDate = 30;
  const sizeColumnOfControl = 20;
  const sizeColumnOfTypeBan = 50;
  const sizeColumnOfDescriptionBan = 150;
  const sizeColumnOfBannedAtDate = 40;
  const sizeColumnOfExpiresDate = 40;

  const [players, setPlayers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importedJsonData, setImportedJsonData] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileType, setImportFileType] = useState(null); // 'json' или 'csv'

  const limit = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState("ban"); // 'ban' | 'unban' | 'delete'
  const [selectedParticipantForAction, setSelectedParticipantForAction] =
    useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Динамическая конфигурация для кнопки управления в зависимости от выбранного фильтра (Вариант 1)
  const addButtonConfig = useMemo(() => {
    const configs = {
      all: {
        text: "Добавить одного",
        icon: <UserPlus size={14} />,
        action: () => handleOpenAddModal(),
      },
      rating: {
        text: "Добавить одного",
        icon: <UserPlus size={14} />,
        action: () => handleOpenAddModal(),
      },
      banned: {
        text: "Внести в бан-лист",
        icon: <Ban size={14} className="text-red-400" />,
        action: () => handleOpenAddModal(), // Можешь открывать эту же модалку или кастомную
      },
    };
    return configs[activeFilter] || configs.all;
  }, [activeFilter]);

  const handleImportFile = (file) => {
    if (!file) return;

    const isJson = file.type === "application/json" || file.name.endsWith(".json");
    const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");

    if (!isJson && !isCsv) {
      addLog("Допустимы только файлы форматов .json и .csv", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target.result;

      if (isJson) {
        try {
          const parsedData = JSON.parse(fileContent);
          setImportedJsonData(parsedData);
          setImportFileType("json");
          setIsImportModalOpen(true);
          addLog("Файл JSON успешно считан", "success");
        } catch (error) {
          addLog("Ошибка парсинга JSON. Проверьте структуру файла.", "error");
        }
      } else if (isCsv) {
        try {
          const parsedData = parseCsvToObjects(fileContent);
          
          if (parsedData.length === 0) {
            addLog("CSV файл пуст или некорректен", "warn");
            return;
          }

          setImportedJsonData(parsedData);
          setImportFileType("csv");
          setIsImportModalOpen(true);
          addLog("Файл CSV успешно считан и преобразован", "success");
        } catch (error) {
          addLog("Ошибка парсинга CSV. Проверьте разделители.", "error");
        }
      }
    };
    reader.readAsText(file);
  };

  const parseCsvToObjects = (text) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) return [];

    const firstLine = lines[0];
    const delimiter = firstLine.includes(";") ? ";" : ",";
    const headers = firstLine.split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());

    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const regex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
      const values = currentLine.split(regex).map(v => v.replace(/^["']|["']$/g, '').trim());

      if (values.length === headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        result.push(obj);
      }
    }
    return result;
  };

  const handleConfirmJsonImport = async (data) => {
    try {
      if (activeFilter === "banned") {
        // ЛОГИКА: Импорт списка игроков сразу в бан-лист
        // Здесь вызывай нужный метод Go-бэкенда, например:
        // await AddBansFromJson(data, selectedGame);
        addLog(`Успешно импортировано в БАН-ЛИСТ записей: ${data.length}`, "warn");
      } else {
        // Стандартная логика импорта обычных игроков
        // await AddParticipantsFromJson(data, selectedGame); 
        addLog(`Успешно импортировано участников: ${data.length}`, "success");
      }

      setIsImportModalOpen(false);
      setImportedJsonData(null);
      setImportFileType(null);
      fetchData(false); 
    } catch (err) {
      addLog("Ошибка при сохранении импортированных данных в БД", "error");
    }
  };

 const triggerParticipantAction = (participant, action) => {
  if (participant) {
    // Проверяем все возможные варианты написания ID
    const realId = participant.id ?? participant.Id ?? 0;
    setSelectedParticipantForAction({
      id: realId,
      nickname: participant.gameNickname || participant.nickname || "Неизвестный",
    });
  } else {
    setSelectedParticipantForAction(null);
  }
  setActionModalType(action);
  setIsActionModalOpen(true);
};

  const handleConfirmAction = async (data) => {
    setActionLoading(true);
    try {
      if (data.action === "ban") {
        const banRequest = {
          id: selectedParticipantForAction.id,
          typeBan: data.typeBan,
          reason: data.reason.trim(),
          duration: data.duration,
          unit: data.unit,
          isPermanent: data.isPermanent,
        };
        await AddBanToParticipant(banRequest);
        addLog(`Игрок ${selectedParticipantForAction.nickname} успешно забанен`, "warn");
      } else if (data.action === "unban") {
        const unbanRequest = { participantId: selectedParticipantForAction.id };
        await DelBanFromParticipant(unbanRequest);
        addLog(`Игрок ${selectedParticipantForAction.nickname} разбанен`, "info");
      } else if (data.action === "delete") {
        const deleteRequest = { id: selectedParticipantForAction.id };
        await DelParticipant(deleteRequest);
        addLog(`Игрок ${selectedParticipantForAction.nickname} полностью удален из базы`, "error");
      } else if (data.action === "reset_rating_all") {
        const resetRatingRequest = { gameName: selectedGame };
        await ResetRaiting(resetRatingRequest);
        addLog(`Рейтинг игроков игры ${selectedGame} полностью сброшен`, "info");
      }

      setIsActionModalOpen(false);
      fetchData(false);
    } catch (err) {
      console.error("Ошибка при выполнении действия над участником:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = (participant) => {
    setEditingParticipant(participant);
    setIsModalOpen(true);
  };

 const handleSaveParticipant = async (data) => {
  setModalLoading(true);
  try {
    if (editingParticipant) {
      const updateRequest = {
        id: editingParticipant.id,
        nickname: data.nickname,
        gameId: data.gameId,
        gameName: selectedGame,
        region: data.region,
        locale: data.locale,
        rating: Number(data.rating),
        messengerName: data.messenger.platform,
        messengerLogin: data.messenger.login,
        tournamentPlatformName: data.tournament.platform,
        tournamentPlatformLogin: data.tournament.login,
        
        // Если есть данные о бане (например, редактируем забаненного или добавляем бан),
        // передаем объект. В противном случае — null (на бэкенде будет nil)
        banInfo: data.banInfo ? {
          id: editingParticipant.id,
          typeBan: data.banInfo.typeBan,
          reason: data.banInfo.reason,
          duration: Number(data.banInfo.duration),
          unit: data.banInfo.unit,
          isPermanent: data.banInfo.isPermanent
        } : null
      };
      // Редактирование существующего игрока
      await EditParticipant(
        // editingParticipant.id, data.nickname, data.gameId, selectedGame,
        // data.region, data.locale, data.rating, data.messenger.platform,
        // data.messenger.login, data.tournament.platform, data.tournament.login,
        updateRequest
      );
      setIsModalOpen(false);
      await fetchData(false, searchQuery);
      addLog(`Данные игрока ${data.nickname} успешно изменены`, "success");
    } else {
      // Добавление нового игрока
      const response = await AddParticipant(
        data.nickname, data.gameId, selectedGame, data.region, data.locale,
        data.rating, data.messenger.platform, data.messenger.login,
        data.tournament.platform, data.tournament.login,
      );

      // Проверяем, был ли открыт режим бана в модалке
      if (data.isDirectBan && data.banInfo) {
        
        const playerDbId = response && typeof response === 'object' && 'id' in response 
          ? response.id 
          : Number(response) || Number(data.gameId);

        const banRequest = {
          id: Number(playerDbId),
          typeBan: data.banInfo.typeBan,
          reason: data.banInfo.reason,
          duration: Number(data.banInfo.duration),
          unit: data.banInfo.unit,
          isPermanent: data.banInfo.isPermanent,
          gameName: selectedGame 
        };

        // 1. Сначала дожидаемся сохранения бана
        await AddBanToParticipant(banRequest);
        
        // 2. Закрываем модалку
        setIsModalOpen(false);
        
        // 3. Делаем ЕДИНСТВЕННЫЙ вызов обновления с задержкой, чтобы БД успела зафиксировать статус
        setTimeout(async () => {
          await fetchData(false); 
          addLog(`Игрок ${data.nickname} добавлен и сразу внесен в бан-лист`, "warn");
        }, 300);

      } else {
        // Обычный сценарий без бана
        setIsModalOpen(false);
        await fetchData(false);
        addLog(`Игрок ${data.nickname} успешно добавлен`, "success");
      }
    }
  } catch (err) {
    console.error("Ошибка при сохранении участника:", err);
    if (typeof addLog === 'function') {
      addLog(`Ошибка при сохранении: ${err.message || err}`, "error");
    }
  } finally {
    setModalLoading(false);
  }
};
  const handleOpenAddModal = () => {
    setEditingParticipant(null);
    setIsModalOpen(true);
  };

  const handleLocalRatingChange = (participantId, val) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, rating: val } : p)),
    );
    debouncedRatingUpdate(participantId, val);
  };

  const handleUpdateRating = async (participantId, currentRating, delta) => {
    const newRating = Math.max(0, currentRating + delta);
    try {
      await EditParticipantStatsRating(participantId, newRating);
      setPlayers((prev) =>
        prev.map((p) => p.id === participantId ? { ...p, rating: newRating } : p),
      );
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
    [],
  );

  const fetchData = async (isNextPage = false, search = undefined) => {
    setLoading(true);
    try {
      const currentOffset = isNextPage ? players.length : 0;
      const currentSearch = search !== undefined ? search : searchQuery;
      const trimmedSearch = currentSearch ? currentSearch.trim() : "";

      let items = [];
      let total = 0;

      // РАЗВЕТВЛЕНИЕ ЛОГИКИ В ЗАВИСИМОСТИ ОТ ФИЛЬТРА
      if (activeFilter === "banned") {
        const response = await GetBanned(
          selectedGame,
          limit,
          currentOffset,
          trimmedSearch
        );
        if (response) {
          const rawList = response.list || [];
          items = rawList.map((b) => ({
            ...b,
            id: b.id !== undefined ? b.id : b.Id, // Проверяем обе буквы, записываем строго в id
            nickname: b.gameNickname || b.nickname,
            gameId: b.gameId || b.gameID
          }));
          total = response.totalCount || items.length;
        }
      } else {
        // Стандартный запрос для вкладок "Все" и "Рейтинг"
        const response = await GetParticipants(
          nameMessengerPlatform,
          nameTournamentPlatform,
          selectedGame,
          limit,
          currentOffset,
          trimmedSearch
        );

        if (response) {
          items = response.items || [];
          total = response.totalCount || 0;
        }
      }

      // Наполнение стейта игроков для рендеринга таблицы
      if (isNextPage) {
        setPlayers((prev) => [...prev, ...items]);
      } else {
        setPlayers(items);
      }
      setTotalCount(total);

    } catch (err) {
      if (typeof addLog === 'function') {
        addLog(`Ошибка при получении списка: ${err.message || err}`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useMemo(
    () => debounce((query) => fetchData(false, query), 500),
    [],
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedFetch(value);
  };

  useEffect(() => {
    fetchDataRef.current = (isNext, search) => fetchData(isNext, search);
  }, [selectedGame, activeFilter, players.length, searchQuery]);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    const tableContainer = document.getElementById("table-scroll-container");
    if (!tableContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = tableContainer;
      if (scrollHeight - scrollTop - clientHeight < 100 && !loading && players.length < totalCount) {
        fetchDataRef.current(true);
      }
    };

    tableContainer.addEventListener("scroll", handleScroll);
    return () => tableContainer.removeEventListener("scroll", handleScroll);
  }, [loading, players.length, totalCount]);

  useEffect(() => {
    fetchData(false);
  }, [selectedGame, activeFilter]);

  const addLog = (msg, type) => console.log(`[${type}] ${msg}`);

const filteredPlayers = useMemo(() => {
    let list = players ? [...players] : [];
    
    // Если вкладка "banned", бэкенд уже прислал чистый отфильтрованный список нарушителей
    if (activeFilter === "banned") {
      return list; 
    } 
    
    // Если вкладка "rating", оставляем только сортировку по рейтингу активных
    if (activeFilter === "rating") {
      return list
        .filter((p) => String(p?.isBanned || p?.status).toLowerCase() !== "banned")
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    return list;
  }, [players, activeFilter]);

  const themeClasses =
    theme === "dark" ? "bg-[#050505] text-white border-white/5" : "bg-slate-50 text-slate-900 border-slate-200";

  const getRelativeTime = (dateString) => {
    if (!dateString || dateString.startsWith("0001")) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "только что";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин. назад`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч. назад`;
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 lg:p-1 transition-all font-sans ${themeClasses}`}>
      <style>{`
        window::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
        body { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar { overflow-y: auto; scrollbar-color: rgba(59, 130, 246, 0.5) transparent; scrollbar-width: thin; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; margin-block: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 10px; transition: all 0.3s ease; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.6); }
      `}</style>

      <div className={`w-full max-w-[100rem] max-h-[70vh] rounded-[40px] border border-white/5 p-8 lg:p-12 flex flex-col space-y-10 transition-all duration-500 ${
        theme === "dark" ? "bg-[#0A0A0A] shadow-2xl" : "bg-white shadow-xl"
      }`}>
        <div className="max-w-[100rem] max-auto space-y-6">
          <div className="space-y-4">
            
            {/* Main Action Bar */}
            <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
              
              {/* Обновленный блок динамической кнопки управления (Вариант 1) */}
              <div
                className="relative min-h-[56px] w-full lg:w-[220px] group shrink-0"
                onMouseEnter={() => setIsAddHovered(true)}
                onMouseLeave={() => setIsAddHovered(false)}
              >
                {/* Лицевая сторона кнопки */}
                <div
                  className={`absolute inset-0 flex items-center justify-center text-white rounded-xl font-black text-xs uppercase italic transition-all duration-300 z-10 ${
                    activeFilter === "banned" ? "bg-red-900/40 border border-red-500/30 text-red-400" : "bg-blue-600"
                  } ${isAddHovered ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
                >
                  {activeFilter === "banned" ? <Ban size={18} className="mr-2 animate-pulse" /> : <Plus size={18} className="mr-2" />}
                  {activeFilter === "banned" ? "Управление банами" : "Добавить"}
                </div>

                {/* Задняя сторона (Доступные опции при ховере) */}
                <div
                  className={`absolute inset-0 flex gap-0.5 transition-all duration-300 z-20 ${isAddHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                >
                  <button
                    onClick={addButtonConfig.action}
                    className={`flex-1 flex flex-col items-center justify-center rounded-l-xl transition-colors text-white ${
                      activeFilter === "banned" ? "bg-red-700 hover:bg-red-600" : "bg-blue-700 hover:bg-blue-500"
                    }`}
                  >
                    {addButtonConfig.icon}
                    <span className="text-[7px] font-black uppercase mt-1 text-center px-1">
                      {addButtonConfig.text}
                    </span>
                  </button>

                  <input
                    type="file"
                    accept=".json, .csv, text/csv"
                    id="json-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImportFile(e.target.files[0]);
                      }
                      e.target.value = "";
                    }}
                  />

                  <button
                    onClick={() => document.getElementById("json-file-input").click()}
                    className={`flex-[1.2] flex flex-col items-center justify-center border transition-all rounded-r-xl py-3 px-1 ${
                      theme === "dark"
                        ? activeFilter === "banned"
                          ? "bg-red-950/20 border-red-500/20 text-red-400 hover:bg-red-900/30"
                          : "bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20"
                        : activeFilter === "banned"
                          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    <FileUp size={15} className="animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-wider mt-1 text-center leading-tight">
                      {activeFilter === "banned" ? "Импорт бан-листа" : "Импорт файла"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Поисковая панель */}
              <div className="flex-1 relative w-full lg:w-auto">
                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  type="text"
                  placeholder="Поиск по нику, ID или региону..."
                  className={`w-full pl-12 pr-6 h-[56px] rounded-xl border text-[12px] font-bold outline-none transition-all focus:ring-2 focus:ring-blue-600/20 ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-slate-200"}`}
                />
              </div>

              {/* Селектор игр */}
              <div className="relative group">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  disabled={loading}
                  className={`appearance-none flex items-center w-[160px] h-[56px] pl-4 pr-10 rounded-xl border transition-all cursor-pointer outline-none text-[11px] font-black uppercase tracking-tight ${
                    theme === "dark" ? "bg-[#121212] border-white/5 text-slate-400 hover:text-blue-500 hover:border-blue-500/50" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="Tekken8" className={theme === "dark" ? "bg-[#1a1a1a] text-slate-300" : "bg-white text-slate-900"}>Tekken 8</option>
                  <option value="SF6" className={theme === "dark" ? "bg-[#1a1a1a] text-slate-300" : "bg-white text-slate-900"}>SF6</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                  {loading ? <RefreshCcw size={14} className="animate-spin text-blue-500" /> : <ChevronDown size={16} className={`transition-colors ${theme === "dark" ? "text-slate-600 group-hover:text-blue-500" : "text-slate-400 group-hover:text-blue-600"}`} />}
                </div>
              </div>

              {/* Навигация по фильтрам */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 h-[56px] ${theme === "dark" ? "bg-black/20 border-white/5" : "bg-slate-100 border-slate-200"}`}>
                {[
                  { id: "all", label: "Все", icon: <LayoutGrid size={14} /> },
                  { id: "rating", label: "Рейтинг", icon: <Trophy size={14} /> },
                  { id: "banned", label: "Забаненные", icon: <ShieldAlert size={14} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 h-full rounded-lg text-[10px] font-black uppercase italic transition-all whitespace-nowrap ${
                      activeFilter === tab.id ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-blue-500"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Таблица */}
            <div className={`${theme === "dark" ? "bg-[#111]" : "bg-slate-100"} border-b border-white/5 overflow-x-auto hide-scrollbar`}>
              <table className="w-full text-left text-[11px] table-fixed min-w-[1100px]">
                <thead>
                  <tr className={`${theme === "dark" ? "text-slate-400" : "text-slate-600"} uppercase font-black italic`}>
                    <th className="p-4" style={{ width: `${sizeColumnOfNickname}px` }}>Никнейм</th>
                    <th className="p-4" style={{ width: `${sizeColumnOfGameID}px` }}>Игровой ID</th>
                    {activeFilter === "banned" ? (
                      <>
                        <th className="p-4 text-red-500" style={{ width: `${sizeColumnOfTypeBan}px` }}>Причина бана</th>
                        <th className="p-4 text-amber-500/80" style={{ width: `${sizeColumnOfDescriptionBan}px` }}>Описание нарушения</th>
                        <th className="p-4 text-slate-400" style={{ width: `${sizeColumnOfBannedAtDate}px` }}>Дата выдачи</th>
                        <th className="p-4 text-slate-400" style={{ width: `${sizeColumnOfExpiresDate}px` }}>Истекает</th>
                        <th className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>Управление</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4" style={{ width: `${sizeColumnOfRegion}px` }}>Регион</th>
                        <th className="p-4" style={{ width: `${sizeColumnOfLanguage}px` }}>Язык</th>
                        <th className="p-4 text-blue-500" style={{ width: `${sizeColumnOfMMR}px` }}>MMR Рейтинг</th>
                        <th className="p-3" style={{ width: `${sizeColumnOfPlatforms}px` }}>Платформы</th>
                        <th className="p-3" style={{ width: `${sizeColumnOfUpdateDate}px` }}>Обновлено</th>
                        <th className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>Управление</th>
                      </>
                    )}
                  </tr>
                </thead>
              </table>
            </div>

            {/* Скролл-контейнер тела таблицы */}
            <div id="table-scroll-container" className="overflow-y-auto overflow-x-auto custom-scrollbar" style={{ maxHeight: "27rem" }}>
              <table className="w-full text-left text-[11px] table-fixed min-w-[1100px] border-collapse">
                <tbody className="divide-y divide-white/5">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-blue-600/5 transition-colors align-middle">
                        <td className="p-4" style={{ width: `${sizeColumnOfNickname}px` }}>
                          <span className={`font-black text-[13px] italic tracking-tight break-all block ${p.isBanned === "banned" ? "text-red-500" : ""}`}>
                            {p.gameNickname || p.messenagerLogin || "N/D"}
                          </span>
                        </td>
                        <td className="p-4" style={{ width: `${sizeColumnOfGameID}px` }}>
                          <span className="font-mono text-slate-500 font-bold block">{p.gameId}</span>
                        </td>

                        {activeFilter === "banned" ? (
                          <>
                            <td className="p-4 text-red-500 font-bold italic truncate" style={{ width: `${sizeColumnOfTypeBan}px` }}>{p.typeBan || "Бан"}</td>
                            <td className="p-4" style={{ width: `${sizeColumnOfDescriptionBan}px` }}>
                              <div className={`text-[10px] leading-snug opacity-80 whitespace-normal break-words ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                                {p.reason || "Детальное описание отсутствует."}
                              </div>
                            </td>
                            <td className="p-4 opacity-70 italic whitespace-nowrap" style={{ width: `${sizeColumnOfBannedAtDate}px` }}>{getRelativeTime(p.bannedAt)}</td>
                            <td className="p-4 font-bold whitespace-nowrap" style={{ width: `${sizeColumnOfExpiresDate}px` }}>
                              {p.expiresAt && !p.expiresAt.startsWith("0001") ? (
                                <span className="text-amber-500 opacity-80 text-[11px] font-mono">
                                  {new Date(p.expiresAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              ) : (
                                <span className="text-red-600 uppercase font-black tracking-wider text-[9px] bg-red-600/10 px-1.5 py-0.5 rounded border border-red-600/20">Пермач</span>
                              )}
                            </td>
                            <td className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>
                              <div className="flex flex-col gap-1.5 py-2">
                                <button onClick={() => handleOpenEditModal(p)} className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[8px] font-black uppercase">
                                  <Edit2 size={11} /> Изменить
                                </button>
                                <button onClick={() => triggerParticipantAction(p, "unban")} className="flex items-center justify-center gap-1.5 px-2 py-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-lg font-black uppercase text-[8px] transition-all w-full">
                                  <ShieldCheck size={11} /> Разбанить
                                </button>
                                <button onClick={() => triggerParticipantAction(p, "delete")} className="flex items-center justify-center gap-1.5 px-2 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg font-black uppercase text-[8px] transition-all w-full">
                                  <Trash2 size={11} /> Удалить
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4" style={{ width: `${sizeColumnOfRegion}px` }}>
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${theme === "dark" ? "bg-white/5" : "bg-slate-100"}`}>{p.region}</span>
                            </td>
                            <td className="p-4 font-bold italic opacity-70 uppercase whitespace-nowrap" style={{ width: `${sizeColumnOfLanguage}px` }}>{p.locale}</td>
                            <td className="p-4" style={{ width: `${sizeColumnOfMMR}px` }}>
                              <input
                                type="number"
                                value={p.rating || 0}
                                min="0"
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  if (val >= 0) handleLocalRatingChange(p.id, val);
                                }}
                                className="bg-transparent text-blue-500 font-black text-sm italic outline-none border-b border-transparent focus:border-blue-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                style={{ width: `${sizeColumnOfMMRPoints}px` }}
                              />
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => handleUpdateRating(p.id, p.rating, 10)} className="w-7 h-7 flex items-center justify-center bg-green-600/10 text-green-500 rounded-lg border border-green-600/20 hover:bg-green-600/20 transition-colors">
                                  <Plus size={12} />
                                </button>
                                <button onClick={() => handleUpdateRating(p.id, p.rating, -10)} className="w-7 h-7 flex items-center justify-center bg-red-600/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-600/20 transition-colors">
                                  <Minus size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="p-4" style={{ width: `${sizeColumnOfPlatforms}px` }}>
                              <div className="flex flex-col text-[9px] font-bold whitespace-nowrap leading-tight">
                                <span className="truncate text-blue-500 uppercase font-black">{nameTournamentPlatform}</span>
                                {p.tournamentPlatformId && <span className="opacity-60 text-[8px] truncate">ID: {p.tournamentPlatformId}</span>}
                                {p.tournamentPlatformLogin && <span className="opacity-60 text-[8px] truncate">Login: {p.tournamentPlatformLogin}</span>}
                                <span className="opacity-40 text-[8px] truncate mt-1">{nameMessengerPlatform}: {p.messenagerID || "—"}</span>
                              </div>
                            </td>
                            <td className="p-4 opacity-60 italic text-[10px] whitespace-nowrap" style={{ width: `${sizeColumnOfUpdateDate}px` }}>{getRelativeTime(p.updatedAt)}</td>
                            <td className="p-4" style={{ width: `${sizeColumnOfControl}px` }}>
                              <div className="flex flex-col gap-1.5">
                                <button onClick={() => handleOpenEditModal(p)} className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[8px] font-black uppercase">
                                  <Edit2 size={11} /> Изменить
                                </button>
                                {p.isBanned === "banned" ? (
                                  <button onClick={() => triggerParticipantAction(p, "unban")} className="w-full flex items-center justify-center gap-2 p-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-lg text-[8px] font-black uppercase">
                                    <ShieldCheck size={11} /> Разбанить
                                  </button>
                                ) : (
                                  <button onClick={() => triggerParticipantAction(p, "ban")} className="w-full flex items-center justify-center gap-2 p-2 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg text-[8px] font-black uppercase">
                                    <Ban size={11} /> Забанить
                                  </button>
                                )}
                                <button onClick={() => triggerParticipantAction(p, "delete")} className="w-full flex items-center justify-center gap-2 p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[8px] font-black uppercase">
                                  <Trash2 size={11} /> Удалить
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeFilter === "banned" ? 7 : 8} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-2xl text-slate-500/40 mb-4 shadow-inner">
                            <Search size={32} strokeWidth={1.5} className="animate-pulse" />
                          </div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1 italic">Данные отсутствуют</h3>
                          <p className="text-[10px] text-slate-500 max-w-[250px] leading-relaxed uppercase font-bold">Нет данных по выбранным фильтрам поиска</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {loading && <div className="p-4 text-center text-[10px] font-black uppercase italic text-amber-500">Загрузка участников...</div>}
            </div>

            {/* Footer Metadata & Global Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase italic px-2">
              <button
                onClick={() => triggerParticipantAction(null, "reset_rating_all")}
                className={`group flex items-center gap-2 h-[46px] px-5 border transition-all rounded-xl text-[10px] font-black uppercase italic tracking-wider ${
                  theme === "dark" ? "bg-red-600/10 border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                }`}
              >
                <RotateCcw size={14} className="transform group-hover:rotate-[-180deg] transition-transform duration-500 shrink-0" />
                <span>Сброс рейтинга всех игроков</span>
              </button>
              <div className={`flex items-center h-[46px] px-5 border rounded-xl text-[10px] font-black uppercase italic tracking-wider ${
                theme === "dark" ? "bg-blue-600/5 border-blue-500/10 text-slate-400" : "bg-blue-50/50 border-blue-200 text-slate-600"
              }`}>
                <span>Всего игроков в базе данных: <span className={`ml-1 font-mono text-xs font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>{totalCount}</span></span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Модальные окна компонентов */}
      <ParticipantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveParticipant}
        initialData={editingParticipant}
        loading={modalLoading}
        theme={theme}
        activeFilter={activeFilter}
      />
      <ParticipantActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onConfirm={handleConfirmAction}
        actionType={actionModalType}
        participantData={selectedParticipantForAction}
        currentGame={selectedGame}
        loading={actionLoading}
        theme={theme}
        activeFilter={activeFilter}
      />
      <ImportJsonModal 
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportedJsonData(null);
          setImportFileType(null);
        }}
        onConfirm={handleConfirmJsonImport}
        jsonData={importedJsonData}
        fileType={importFileType}
        theme={theme}
        activeFilter={activeFilter}
      />
    </div>
  );
};

export default DatabasePlate;