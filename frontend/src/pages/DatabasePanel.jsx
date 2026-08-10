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
  Copy,
  Check,
  ShieldOff,
} from "lucide-react";
import {
  AddParticipant,
  GetParticipants,
  GetParticipantsSortedByRatingList,
  GetBanned,
  EditParticipant,
  EditParticipantStatsRating,
  AddBanToParticipant,
  DelBanFromParticipant,
  DelParticipant,
  ResetRating,
  LoadListPlayers,
  OpenImportFile,
} from "../../wailsjs/go/application/App.js";
import ProgressModal from "../components/modals/ProgressModal.jsx";
import ImportFileModal from "../components/ImportFileModal.jsx";
import ParticipantModal from "../components/modals/ParticipantModal.jsx";
import PanelTemplate from "../components/layout/PanelTemplate.jsx";
import ParticipantActionModal from "../components/modals/ParticipantActionModal.jsx";
import { debounce } from "../utils/debounce.jsx";
import { CopyButton } from "../components/ui/CopyButton.jsx";
import { Field } from "../components/ui/Field.jsx";

const DatabasePlate = ({ theme, locale, lang, themeClasses, selectedGame, setSelectedGame }) => {
  // Notes in 1 request to database
  const limit = 5;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const nameMessengerPlatform = "Discord";
  const nameTournamentPlatform = "Startgg";

  const sizeColumnOfNickname = 40;
  const sizeColumnOfGameID = 30;
  const sizeColumnOfRegion = 30;
  const sizeColumnOfLanguage = 10;
  const sizeColumnOfMMR = 10;
  const sizeColumnOfMMRPoints = 50;
  const sizeColumnOfPlatforms = 30;
  const sizeColumnOfUpdateDate = 30;
  const sizeColumnOfControl = 20;
  const sizeColumnOfTypeBan = 40;
  const sizeColumnOfDescriptionBan = 40;
  const sizeColumnOfBannedAtDate = 30;
  const sizeColumnOfExpiresDate = 40;

  // Statements for UI
  const [players, setPlayers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importFilePath, setImportedFilePath] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileType, setImportFileType] = useState(null); // 'json' или 'csv'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState("ban"); // 'ban' | 'unban' | 'delete'
  const [selectedParticipantForAction, setSelectedParticipantForAction] =
    useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // "idle" | "loading" | "success"
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    console.log("File type:", importFileType);
  }, [importFileType]);

  const listRegions = [
    {
      label: locale.AddButton.AddModalWindow.ListRegions.Europe,
      value: "Europe",
    },
    {
      label: locale.AddButton.AddModalWindow.ListRegions.Asia,
      value: "Asia",
    },
    {
      label: locale.AddButton.AddModalWindow.ListRegions.Africa,
      value: "Africa",
    },
    {
      label: locale.AddButton.AddModalWindow.ListRegions.NorthAmerica,
      value: "NorthAmerica",
    },
    {
      label: locale.AddButton.AddModalWindow.ListRegions.SouthAmerica,
      value: "SouthAmerica",
    },
    {
      label: locale.AddButton.AddModalWindow.ListRegions.Other,
      value: "Other",
    },
    {
      label: locale.AddButton.AddModalWindow.ListRegions.ND,
      value: "N/D",
    },
  ];
  const regionsMap = Object.fromEntries(
    listRegions.map((region) => [region.value, region.label]),
  );

  // UI config for filter buttons (All, Rating or Ban-list)
  const addButtonConfig = useMemo(() => {
    const configs = {
      all: {
        text: locale.AddButton.One,
        icon: <UserPlus size={14} />,
        action: () => handleOpenAddModal(),
      },
      rating: {
        text: locale.AddButton.One,
        icon: <UserPlus size={14} />,
        action: () => handleOpenAddModal(),
      },
      banned: {
        text: locale.AddButton.One,
        icon: <Ban size={14} className="text-red-400" />,
        action: () => handleOpenAddModal(),
      },
    };
    return configs[activeFilter] || configs.all;
  }, [activeFilter, locale]);

  const handleImportFile = async () => {
    const systemFilePath = await OpenImportFile();

    if (!systemFilePath) return;

    const fileName = systemFilePath.split(/[\\/]/).pop();

    const isJson = fileName.toLowerCase().endsWith(".json");
    const isCsv = fileName.toLowerCase().endsWith(".csv");

    if (!isJson && !isCsv) return;

    setImportedFilePath(systemFilePath);
    setImportFileType(isJson ? "json" : "csv");
    setIsImportModalOpen(true);
  };


  // Handler for confirm file import of participants
  const handleConfirmFileImport = async (filePath) => {
    setIsImportModalOpen(false);
    setImportError(null);
    setImportResult(null);
    setImportStatus("loading");
    setIsProgressModalOpen(true);

    try {
      const isBanChecked = activeFilter === "banned";

      console.log(filePath)
      const result = await LoadListPlayers(
        filePath,
        nameTournamentPlatform,
        selectedGame,
        isBanChecked,
      );

      if (!result) {
        throw new Error("null answer from backend");
      }

      const successCount = result.success ?? 0;
      const totalCount = result.total ?? 0;

      setImportResult({ r1: successCount, r2: totalCount });
      if (successCount === 0) {
        setImportStatus("error");
      } else if (successCount !== totalCount) {
        setImportStatus("warning");
      } else {
        setImportStatus("success");
      }

      setImportedFilePath(null);
      setImportFileType(null);

      setTimeout(() => {
        fetchData(false);
      }, 300);
    } catch (err) {
      const errorText = err?.message || err?.toString() || "Unknown error";
      setImportError(errorText);
      setImportStatus("error");
    }
  };

  // Trigger for confirm action with participants
  const triggerParticipantAction = (participant, action) => {
    if (participant) {
      const realId = participant.id ?? participant.Id ?? 0;
      setSelectedParticipantForAction({
        id: realId,
        nickname: participant.gameNickname || participant.nickname || "Unknown",
      });
    } else {
      setSelectedParticipantForAction(null);
    }
    setActionModalType(action);
    setIsActionModalOpen(true);
  };

  // Handler for confirm action with participants
  const handleConfirmAction = async (data) => {
    setActionLoading(true);
    const logActionBanParts = locale.Table.LogsActions.Ban.split("%v");
    const logActionUnbanParts = locale.Table.LogsActions.Unban.split("%v");
    const logActionDeleteParts = locale.Table.LogsActions.Delete.split("%v");
    const logActionRatingParts = locale.Table.LogsActions.Rating.split("%v");
    const logActionErrParts = locale.Table.LogsActions.Err.split("%v");
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
      } else if (data.action === "unban") {
        const unbanRequest = { participantId: selectedParticipantForAction.id };
        await DelBanFromParticipant(unbanRequest);
      } else if (data.action === "delete") {
        const deleteRequest = { id: selectedParticipantForAction.id };
        await DelParticipant(deleteRequest);
      } else if (data.action === "reset_rating_all") {
        const resetRatingRequest = { gameName: selectedGame };
        await ResetRating(resetRatingRequest);
      }

      setIsActionModalOpen(false);
      fetchData(false);
    } catch (err) {
      console.error("Failed do thing under participant: ", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for open modal window for edit data of participant
  const handleOpenEditModal = (participant) => {
    setEditingParticipant(participant);
    setIsModalOpen(true);
  };

  // Handler for actions with participants
  const handleSaveParticipant = async (data) => {
    setModalLoading(true);
    const logActionAddParts = locale.Table.LogsActions.Add.split("%v");
    const logActionAddBanParts = locale.Table.LogsActions.AddBan.split("%v");
    const logActionEditParts = locale.Table.LogsActions.Edit.split("%v");
    const logActionErrParts = locale.Table.LogsActions.Err.split("%v");
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
          banInfo: data.banInfo
            ? {
                id: editingParticipant.id,
                typeBan: data.banInfo.typeBan,
                reason: data.banInfo.reason,
                duration: Number(data.banInfo.duration),
                unit: data.banInfo.unit,
                isPermanent: data.banInfo.isPermanent,
              }
            : null,
        };

        await EditParticipant(updateRequest);
        setIsModalOpen(false);
        await fetchData(false, searchQuery);
      } else {
        const response = await AddParticipant(
          data.nickname,
          data.gameId,
          selectedGame,
          data.region,
          data.locale,
          data.rating,
          data.messenger.platform,
          data.messenger.login,
          data.tournament.platform,
          data.tournament.login,
        );

        // Open modal window with ban?
        if (data.isDirectBan && data.banInfo) {
          const playerDbId =
            response && typeof response === "object" && "id" in response
              ? response.id
              : Number(response) || Number(data.gameId);

          const banRequest = {
            id: Number(playerDbId),
            typeBan: data.banInfo.typeBan,
            reason: data.banInfo.reason,
            duration: Number(data.banInfo.duration),
            unit: data.banInfo.unit,
            isPermanent: data.banInfo.isPermanent,
            gameName: selectedGame,
          };

          await AddBanToParticipant(banRequest);
          setIsModalOpen(false);
          setTimeout(async () => {
            await fetchData(false);
          }, 300);
        } else {
          setIsModalOpen(false);
          await fetchData(false);
        }
      }
    } catch (err) {
      console.error(
        `${logActionErrParts[0]} ${data.nickname} ${logActionErrParts[1]} ${err}`,
        err,
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Handler for open modal window for add participant
  const handleOpenAddModal = () => {
    setEditingParticipant(null);
    setIsModalOpen(true);
  };

  // Handler for change of rating value
  const handleLocalRatingChange = (participantId, val, nickname) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, rating: val } : p)),
    );
    debouncedRatingUpdate(participantId, val, nickname);
  };

  // Handler for update rating
  const handleUpdateRating = async (participantId, gameName, newRating, nickname) => {
    const logActionUpdateRating = locale.Table.LogsActions.UpdateRating;
    const logActionErrParts = locale.Table.LogsActions.Err.split("%v");
    try {
      await EditParticipantStatsRating(participantId, gameName, newRating);

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, rating: newRating } : p,
        ),
      );
    } catch (err) {
      console.error(`${logActionErrParts[0]} ${nickname || "User"}`);
    }
  };

  // Handler for rating values
  const handleUpdateRatingRef = useRef(handleUpdateRating);
  handleUpdateRatingRef.current = handleUpdateRating;

  // Debounce for rating values
  const debouncedRatingUpdate = useMemo(
    () =>
      debounce((participantId, newValue, nickname) => {
        handleUpdateRatingRef.current(participantId, newValue, nickname);
      }, 600),
    [],
  );

  // Fuction of pagination
  const fetchData = async (isNextPage = false, search = undefined) => {
    setLoading(true);

    try {
      const currentOffset = isNextPage ? players.length : 0;
      const currentSearch = search !== undefined ? search : searchQuery;
      const trimmedSearch = currentSearch ? currentSearch.trim() : "";

      let items = [];
      let total = 0;
      if (activeFilter === "banned") {
        const response = await GetBanned(
          nameMessengerPlatform,
          nameTournamentPlatform,
          selectedGame,
          limit,
          currentOffset,
          trimmedSearch,
        );

        if (response) {
          const rawList = response.list || [];

          items = rawList.map((b) => ({
            ...b,
            id: b.id !== undefined ? b.id : b.Id,
            nickname: b.gameNickname || b.nickname,
            gameId: b.gameId || b.gameID,
          }));

          total = response.totalCount || items.length;
        }
      } else if (activeFilter === "rating") {
        const response = await GetParticipantsSortedByRatingList(
          nameMessengerPlatform,
          nameTournamentPlatform,
          selectedGame,
          limit,
          currentOffset,
          trimmedSearch,
        );

        if (response) {
          items = response.items || [];
          total = response.totalCount ?? 0;
        }
      } else {
        const response = await GetParticipants(
          nameMessengerPlatform,
          nameTournamentPlatform,
          selectedGame,
          limit,
          currentOffset,
          trimmedSearch,
        );

        if (response) {
          items = response.items || [];
          total = response.totalCount ?? 0;
        }
      }

      if (isNextPage) {
        setPlayers((prev) => [...prev, ...items]);
      } else {
        setPlayers(items);
      }

      setTotalCount(total);
    } catch (err) {
      console.error(`Failed to get list: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Debounce for fetch
  const debouncedFetch = useMemo(
  () =>
    debounce((query) => {
      fetchDataRef.current(false, query);
    }, 500),
  [],
);

  // Handler for search line
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedFetch(value);
  };

  // Trigger for search line
  useEffect(() => {
    fetchDataRef.current = (isNext, search) => fetchData(isNext, search);
  }, [selectedGame, activeFilter, players.length, searchQuery]);

  // Fetch data for pagination
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;
  // Trigger for pagination
  useEffect(() => {
    const tableContainer = document.getElementById("table-scroll-container");
    if (!tableContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = tableContainer;
      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        !loading &&
        players.length < totalCount
      ) {
        fetchDataRef.current(true);
      }
    };

    tableContainer.addEventListener("scroll", handleScroll);
    return () => tableContainer.removeEventListener("scroll", handleScroll);
  }, [loading, players.length, totalCount]);

  // Switch to selected game
  useEffect(() => {
    fetchData(false);
  }, [selectedGame, activeFilter]);

  // Filter list of players for table
  const filteredPlayers = useMemo(() => {
    let list = players ? [...players] : [];

    if (activeFilter === "banned") {
      return list;
    }

    if (activeFilter === "rating") {
      return list
        .filter(
          (p) => String(p?.isBanned || p?.status).toLowerCase() !== "banned",
        )
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [players, activeFilter]);

  // Function for prepare text of contact participant
  const getParticipantCopyText = (participant) => {
    const isTournamentValid =
      participant.tournamentPlatformLogin &&
      participant.tournamentPlatformLogin !== "N/D";

    const tournamentLine = isTournamentValid
      ? `${nameTournamentPlatform} | Login: ${participant.tournamentPlatformLogin}`
      : `${nameTournamentPlatform} | Login: ${locale.AddButton.AddModalWindow.ListRegions.ND}`;

    const isMessengerValid =
      participant.messengerLogin && participant.messengerLogin !== "N/D";

    const messengerLine = isMessengerValid
      ? `${nameMessengerPlatform} | Login: ${participant.messengerLogin}`
      : `${nameMessengerPlatform} | Login: ${locale.AddButton.AddModalWindow.ListRegions.ND}`;

    return `${tournamentLine}\n${messengerLine}`;
  };

  // Function for get time
  const getRelativeTime = (dateString) => {
    if (!dateString || dateString.startsWith("0001")) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${locale.Table.TimeRemains.JustNow}`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} ${locale.Table.TimeRemains.MinAgo}`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} ${locale.Table.TimeRemains.HourAgo}`;
    return date.toLocaleDateString(lang === "EN" ? "en-US" : "ru-RU");
  };

  // One horizontal scroll for 2 tables
  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const syncScroll = (source) => {
    if (source === "header") {
      if (headerScrollRef.current && bodyScrollRef.current) {
        bodyScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
      }
    } else {
      if (headerScrollRef.current && bodyScrollRef.current) {
        headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
      }
    }
  };

  // Horizontal scroll for double table
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  useEffect(() => {
    const checkHorizontalScroll = () => {
      const el = bodyScrollRef.current;

      if (!el) return;

      setHasHorizontalScroll(el.scrollWidth > el.clientWidth);
    };

    const observer = new ResizeObserver(checkHorizontalScroll);

    if (bodyScrollRef.current) {
      observer.observe(bodyScrollRef.current);
    }

    checkHorizontalScroll();

    return () => observer.disconnect();
  }, []);

  const importType = activeFilter === "banned"
    ? "banList"
    : "database";

  const formatImportMessage = (template, values) => {
    let result = template;

    for (const value of values) {
      result = result.replace("%v", value);
    }

    return result;
  };

  const getImportMessage = () => {
    const messages = locale.AddButton.ImportFile.LoadingImportFileModalWindows;
    const isLoading = importStatus === "loading";
    const isError = importStatus === "error";
    const isWarning = importStatus === "warning";
    const isSuccess = importStatus === "success";

    if (isLoading) {
      return messages.WriteParticipantsInDBMsg;
    }

    if (isWarning) {
      return messages.WarningStatusText;
    }

    if (isError) {
      return `${messages.ErrorImportFileMsg} ${importError}`;
    }

    if (isSuccess) {
      const successCount = importResult?.r1 ?? importResult?.s ?? 0;
      const totalCount = importResult?.r2 ?? importResult?.t ?? 0;

      const template =
        activeFilter === "banned"
          ? messages.SuccessImportBanListMsg
          : messages.SuccessImportDBMsg;

      return formatImportMessage(template, [
        successCount,
        totalCount,
      ]);
    }

    return messages.InitImportFileMsg;
  };

  const importMessage = getImportMessage();
  
  let importProgress = 0;

  if (importStatus === "loading") {
    importProgress = 50;
  }

  if (
    importStatus === "success" ||
    importStatus === "warning" ||
    importStatus === "error"
  ) {
    importProgress = 100;
  }

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="max-w-[100rem] max-auto space-y-6">
        <div className="space-y-4">
          {/* Main Action Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
            <div
              className="relative min-h-[56px] w-full lg:w-[220px] group shrink-0"
              onMouseEnter={() => setIsAddHovered(true)}
              onMouseLeave={() => setIsAddHovered(false)}
            >
              {/* Front side of the button */}
              <div
                className={`absolute inset-0 flex items-center justify-center text-white rounded-xl font-black text-xs uppercase italic transition-all duration-300 z-10 ${
                  activeFilter === "banned"
                    ? "bg-red-600 border border-red-500/30 text-red-400"
                    : "bg-blue-600"
                } ${isAddHovered ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
              >
                {activeFilter === "banned" ? (
                  <Ban size={18} className="mr-2 animate-pulse" />
                ) : (
                  <Plus size={18} className="mr-2" />
                )}
                {activeFilter === "banned"
                  ? locale.AddButton.BanLabel
                  : locale.AddButton.Label}
              </div>

              {/* Back of the button (Available functions inside) */}
              <div
                className={`absolute inset-0 flex gap-0.5 transition-all duration-300 z-20 ${isAddHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
              >
                <button
                  onClick={addButtonConfig.action}
                  className={`flex-1 flex flex-col items-center justify-center rounded-l-xl transition-colors text-white ${
                    activeFilter === "banned"
                      ? "bg-red-700 hover:bg-red-600"
                      : "bg-blue-700 hover:bg-blue-500"
                  }`}
                >
                  {addButtonConfig.icon}
                  <span className="text-[0.625rem] font-black uppercase mt-1 text-center px-1">
                    {addButtonConfig.text}
                  </span>
                </button>
                <button
                  onClick={handleImportFile}
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
                    {locale.AddButton.ImportFile.Label}
                  </span>
                </button>
              </div>
            </div>

            {/* Search panel */}
            <div className="flex-1 relative w-full lg:w-auto">
              <Search
                size={16}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                type="text"
                placeholder={locale.SearchLineLabel}
                className={`w-full pl-12 pr-6 h-[56px] rounded-xl border text-[12px] font-bold outline-none transition-all focus:ring-2 focus:ring-blue-600/20 ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-slate-200"}`}
              />
            </div>

            {/* Selector of games */}
            <div className="relative group">
              <Field
                variant="select"
                value={selectedGame}
                onChange={(value) => setSelectedGame(value)}
                items={[
                  {
                    label: "Tekken 8",
                    value: "Tekken8",
                  },
                  {
                    label: "Street Fighter 6",
                    value: "SF6",
                  },
                ]}
                themeClasses={themeClasses}
                height="56px"
              />
            </div>

            {/* Navigation with filters */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 h-[56px] ${theme === "dark" ? "bg-black/20 border-white/5" : "bg-slate-100 border-slate-200"}`}
            >
              {[
                {
                  id: "all",
                  label: locale.Filters.All,
                  icon: <LayoutGrid size={14} />,
                },
                {
                  id: "rating",
                  label: locale.Filters.Rating,
                  icon: <Trophy size={14} />,
                },
                {
                  id: "banned",
                  label: locale.Filters.BanList,
                  icon: <ShieldAlert size={14} />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-2 px-4 h-full rounded-lg text-[10px] font-black uppercase italic transition-all whitespace-nowrap ${
                    activeFilter === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-500 hover:text-blue-500"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Header table */}
          <div
            ref={headerScrollRef}
            onScroll={() => syncScroll("header")}
            className={`${theme === "dark" ? "bg-[#111]" : "bg-slate-100"} border-b border-white/5 overflow-hidden`}
          >
            <table className="w-full text-left text-[11px] table-fixed min-w-[1100px]">
              <thead>
                <tr
                  className={`${theme === "dark" ? "text-slate-400" : "text-slate-600"} uppercase font-black italic`}
                >
                  <th
                    className="p-4"
                    style={{ width: `${sizeColumnOfNickname}px` }}
                  >
                    {locale.Table.Nickname}
                  </th>
                  <th
                    className="p-4"
                    style={{ width: `${sizeColumnOfGameID}px` }}
                  >
                    {locale.Table.GameID}
                  </th>
                  {activeFilter === "banned" ? (
                    <>
                      <th
                        className="p-4 text-red-500"
                        style={{ width: `${sizeColumnOfTypeBan}px` }}
                      >
                        {locale.Table.ReasonBan}
                      </th>
                      <th
                        className="p-4 text-amber-500/80"
                        style={{ width: `${sizeColumnOfDescriptionBan}px` }}
                      >
                        {locale.Table.DescriptionBan}
                      </th>
                      <th
                        className="p-4 text-slate-400"
                        style={{ width: `${sizeColumnOfBannedAtDate}px` }}
                      >
                        {locale.Table.DateBan}
                      </th>
                      <th
                        className="p-4 text-slate-400"
                        style={{ width: `${sizeColumnOfExpiresDate}px` }}
                      >
                        {locale.Table.IsExpiring}
                      </th>
                      <th
                        className="p-4"
                        style={{ width: `${sizeColumnOfControl}px` }}
                      >
                        {locale.Table.Management.Label}
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        className="p-4"
                        style={{ width: `${sizeColumnOfRegion}px` }}
                      >
                        {locale.Table.Region}
                      </th>
                      <th
                        className="p-4"
                        style={{ width: `${sizeColumnOfLanguage}px` }}
                      >
                        {locale.Table.Language}
                      </th>
                      <th
                        className="p-4 text-blue-500"
                        style={{ width: `${sizeColumnOfMMR}px` }}
                      >
                        {locale.Table.Rating}
                      </th>
                      <th
                        className="p-3"
                        style={{ width: `${sizeColumnOfPlatforms}px` }}
                      >
                        {locale.Table.Contacts}
                      </th>
                      <th
                        className="p-3"
                        style={{ width: `${sizeColumnOfUpdateDate}px` }}
                      >
                        {locale.Table.UpdatedAt}
                      </th>
                      <th
                        className="p-4"
                        style={{ width: `${sizeColumnOfControl}px` }}
                      >
                        {locale.Table.Management.Label}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
            </table>
          </div>

          {/* Body table */}
          <div
            ref={bodyScrollRef}
            onScroll={() => syncScroll("body")}
            id="table-scroll-container"
            className="overflow-y-auto overflow-x-auto custom-scrollbar"
            style={{
              maxHeight: hasHorizontalScroll ? "22rem" : "28rem",
            }}
          >
            <table className="w-full text-left text-[11px] table-fixed min-w-[1100px] border-collapse">
              <tbody>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((p, index) => (
                    <tr
                      key={p.id}
                      className={`
                        hover:bg-blue-600/5
                        transition-colors
                        align-middle
                        ${index !== filteredPlayers.length - 1 ? "border-b border-white/5" : ""}
                      `}
                    >
                      <td
                        className="p-4"
                        style={{ width: `${sizeColumnOfNickname}px` }}
                      >
                        <span
                          className={`font-black text-[13px] italic tracking-tight break-all block ${p.isBanned === "banned" ? "text-red-500" : ""}`}
                        >
                          {p.gameNickname || p.messengerLogin || "N/D"}
                        </span>
                      </td>
                      <td
                        className="p-4"
                        style={{ width: `${sizeColumnOfGameID}px` }}
                      >
                        <span className="font-mono text-slate-500 font-bold block">
                          {p.gameId === "N/D"
                            ? locale.AddButton.AddModalWindow.ListRegions.ND
                            : p.gameId}
                        </span>
                      </td>

                      {activeFilter === "banned" ? (
                        <>
                          <td
                            className="p-4 text-red-500 font-bold italic truncate"
                            style={{ width: `${sizeColumnOfTypeBan}px` }}
                          >
                            {p.typeBan || "Ban"}
                          </td>
                          <td
                            className="p-4"
                            style={{
                              width: `${sizeColumnOfDescriptionBan}px`,
                            }}
                          >
                            <div
                              className={`text-[10px] leading-snug opacity-80 whitespace-normal break-words ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                            >
                              {p.reason || locale.Table.EmptyDescription}
                            </div>
                          </td>
                          <td
                            className="p-4 opacity-70 italic whitespace-nowrap"
                            style={{ width: `${sizeColumnOfBannedAtDate}px` }}
                          >
                            {getRelativeTime(p.bannedAt)}
                          </td>
                          <td
                            className="p-4 font-bold whitespace-nowrap"
                            style={{ width: `${sizeColumnOfExpiresDate}px` }}
                          >
                            {p.expiresAt && !p.expiresAt.startsWith("0001") ? (
                              <span className="text-amber-500 opacity-80 text-[11px] font-mono">
                                {new Date(p.expiresAt).toLocaleString("ru-RU", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : (
                              <span className="text-red-600 uppercase font-black tracking-wider text-[9px] bg-red-600/10 px-1.5 py-0.5 rounded border border-red-600/20">
                                {
                                  locale.AddButton.AddBanFields
                                    .PermanentBanLabel
                                }
                              </span>
                            )}
                          </td>
                          <td
                            className="p-4"
                            style={{ width: `${sizeColumnOfControl}px` }}
                          >
                            <div className="flex flex-col gap-1.5 py-2">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
                              >
                                <Edit2 size={11} />{" "}
                                {locale.Table.Management.Edit}
                              </button>
                              <button
                                onClick={() =>
                                  triggerParticipantAction(
                                    p,
                                    activeFilter === "banned" ? "unban" : "ban",
                                  )
                                }
                                className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg font-black uppercase text-[0.725rem] transition-all w-full ${
                                  activeFilter === "banned"
                                    ? "bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white"
                                    : "bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white"
                                }`}
                              >
                                {activeFilter === "banned" ? (
                                  <>
                                    <ShieldOff size={11} />
                                    {locale.Table.Management.Unban}
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck size={11} />
                                    {locale.Table.Management.Ban}
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  triggerParticipantAction(p, "delete")
                                }
                                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg font-black uppercase text-[0.725rem] transition-all w-full"
                              >
                                <Trash2 size={11} />{" "}
                                {locale.Table.Management.Delete}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            className="p-4"
                            style={{ width: `${sizeColumnOfRegion}px` }}
                          >
                            <span
                              className={`inline-block px-2 py-1 rounded-lg text-[9px] font-black text-left ${
                                theme === "dark" ? "bg-white/5" : "bg-slate-100"
                              }`}
                            >
                              {regionsMap[p.region] === "undefined" || regionsMap[p.region] === "" ?  locale.AddButton.AddModalWindow.ListRegions.ND : regionsMap[p.region]}
                            </span>
                          </td>
                          <td
                            className="p-4 font-bold italic opacity-70 uppercase whitespace-nowrap"
                            style={{ width: `${sizeColumnOfLanguage}px` }}
                          >
                            {p.locale === "N/D"
                              ? locale.AddButton.AddModalWindow.ListRegions.ND
                              : p.locale}
                          </td>
                          <td
                            className="p-4"
                            style={{ width: `${sizeColumnOfMMR}px` }}
                          >
                            <input
                              type="number"
                              value={p.rating || 0}
                              min="0"
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                if (val >= 0)
                                  handleLocalRatingChange(
                                    p.id,
                                    val,
                                    p.gameNickname,
                                  );
                              }}
                              className="bg-transparent text-blue-500 font-black text-sm italic outline-none border-b border-transparent focus:border-blue-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              style={{ width: `${sizeColumnOfMMRPoints}px` }}
                            />
                            <div className="flex gap-1 mt-1">
                              {/* Button plus */}
                              <button
                                onClick={() =>
                                  handleUpdateRating(
                                    p.id,
                                    selectedGame,
                                    Math.max(0, (p.rating || 0) + 10),
                                    p.gameNickname,
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center bg-green-600/10 text-green-500 rounded-lg border border-green-600/20 hover:bg-green-600/20 transition-colors"
                              >
                                <Plus size={12} />
                              </button>

                              {/* Button minus */}
                              <button
                                onClick={() =>
                                  handleUpdateRating(
                                    p.id,
                                    selectedGame,
                                    Math.max(0, (p.rating || 0) - 10),
                                    p.gameNickname,
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center bg-red-600/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-600/20 transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                            </div>
                          </td>
                          <td
                            className="p-4"
                            style={{ width: `${sizeColumnOfPlatforms}px` }}
                          >
                            <div className="flex flex-row items-center justify-between gap-2">
                              <div className="flex flex-col text-xs font-bold whitespace-nowrap leading-tight min-w-0">
                                <span className="truncate text-blue-500 font-black">
                                  {nameTournamentPlatform}
                                </span>
                                <span className="opacity-60 text-[10px] truncate">
                                  {`${locale.AddButton.AddContactOfMessenger.Login}: ${p.tournamentPlatformLogin === "N/D" || p.tournamentPlatformLogin === "" ? locale.AddButton.AddModalWindow.ListRegions.ND : p.tournamentPlatformLogin}`}
                                </span>
                                <span className="text-purple-500 font-black mt-1">
                                  {nameMessengerPlatform}
                                </span>
                                <span className="opacity-60 text-[10px] truncate">
                                  {`${locale.AddButton.AddDataOfTourneyPlatform.Nickname}: ${p.messengerLogin === "N/D" || p.messengerLogin === "" ? locale.AddButton.AddModalWindow.ListRegions.ND : p.messengerLogin}`}
                                </span>
                              </div>
                              <CopyButton text={getParticipantCopyText(p)} />
                            </div>
                          </td>
                          <td
                            className="p-4 opacity-60 italic text-[10px] whitespace-nowrap"
                            style={{ width: `${sizeColumnOfUpdateDate}px` }}
                          >
                            {getRelativeTime(p.updatedAt)}
                          </td>
                          <td
                            className="p-4"
                            style={{ width: `${sizeColumnOfControl}px` }}
                          >
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
                              >
                                <Edit2 size={11} />{" "}
                                {locale.Table.Management.Edit}
                              </button>
                              {p.isBanned === "banned" ? (
                                <button
                                  onClick={() =>
                                    triggerParticipantAction(p, "unban")
                                  }
                                  className="w-full flex items-center justify-center gap-2 p-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
                                >
                                  <ShieldCheck size={11} />{" "}
                                  {locale.Table.Management.Unban}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    triggerParticipantAction(p, "ban")
                                  }
                                  className="w-full flex items-center justify-center gap-2 p-2 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
                                >
                                  <Ban size={11} />{" "}
                                  {locale.Table.Management.Ban}
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  triggerParticipantAction(p, "delete")
                                }
                                className="w-full flex items-center justify-center gap-2 p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
                              >
                                <Trash2 size={11} />{" "}
                                {locale.Table.Management.Delete}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={activeFilter === "banned" ? 7 : 8}
                      className="p-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-2xl text-slate-500/40 mb-4 shadow-inner">
                          <Search
                            size={32}
                            strokeWidth={1.5}
                            className="animate-pulse"
                          />
                        </div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1 italic">
                          {locale.Table.NoData}
                        </h3>
                        <p className="text-[10px] text-slate-500 max-w-[250px] leading-relaxed uppercase font-bold">
                          {locale.Table.NoDataAccordingFilters}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {loading && (
              <div className="p-4 text-center text-[10px] font-black uppercase italic text-amber-500">
                {locale.Table.LoadingDataPlayers}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase italic px-2">
            {activeFilter === "rating" && (
              <button
                onClick={() =>
                  triggerParticipantAction(null, "reset_rating_all")
                }
                className={`group flex items-center gap-2 h-[46px] px-5 border transition-all rounded-xl text-[10px] font-black uppercase italic tracking-wider ${
                  theme === "dark"
                    ? "bg-red-600/10 border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white"
                    : "bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                }`}
              >
                <RotateCcw
                  size={14}
                  className="transform group-hover:rotate-[-180deg] transition-transform duration-500 shrink-0"
                />
                <span>{locale.ResetRatingButton.Label}</span>
              </button>
            )}
            <div className="hidden sm:block" />
            <div
              className={`flex items-center h-[46px] px-5 border rounded-xl text-[10px] font-black uppercase italic tracking-wider ${
                theme === "dark"
                  ? "bg-blue-600/5 border-blue-500/10 text-slate-400"
                  : "bg-blue-50/50 border-blue-200 text-slate-600"
              }`}
            >
              {activeFilter === "banned" ? (
                <span>
                  {locale.TotalCountBannedNotesInDBLabel}:{" "}
                  <span
                    className={`ml-1 font-mono text-xs font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                  >
                    {totalCount}
                  </span>
                </span>
              ) : activeFilter === "rating" ? (
                <span>
                  {locale.TotalCountRatingParticipants}:{" "}
                  <span
                    className={`ml-1 font-mono text-xs font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                  >
                    {totalCount}
                  </span>
                </span>
              ) : (
                <span>
                  {locale.TotalCountNotesInDBLabel}:{" "}
                  <span
                    className={`ml-1 font-mono text-xs font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                  >
                    {totalCount}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal windows */}
      <ParticipantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveParticipant}
        participantData={editingParticipant}
        activeFilter={activeFilter}
        locale={locale.AddButton}
        themeClasses={themeClasses}
        loading={modalLoading}
      />
      <ParticipantActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onConfirm={handleConfirmAction}
        actionType={actionModalType}
        participantData={selectedParticipantForAction}
        currentGame={selectedGame}
        loading={actionLoading}
        locale={locale}
        theme={theme}
        themeClasses={themeClasses}
      />
      <ImportFileModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportedFilePath(null);
          setImportFileType(null);
        }}
        onConfirm={handleConfirmFileImport}
        filePath={importFilePath}
        fileType={importFileType}
        theme={theme}
        activeFilter={activeFilter}
        locale={locale.AddButton.ImportFile}
        themeClasses={themeClasses}
      />
      <ProgressModal
        isOpen={isProgressModalOpen}
        status={importStatus}
        progress={importProgress}
        title={locale.AddButton.ImportFile.LoadingImportFileModalWindows.StatusInProcess}
        message={importMessage}
        closeButtonLabel={
          locale.AddButton.ImportFile.LoadingImportFileModalWindows.CloseButtonLabel
        }
        themeClasses={themeClasses}
        onClose={() => {
          setIsProgressModalOpen(false);
          setImportError(null);
          setImportResult(null);

          setTimeout(() => {
            fetchData(false);
          }, 100);
        }}
      />
    </PanelTemplate>
  );
};

export default DatabasePlate;
