import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  UserPlus,
  FileUp,
  LayoutGrid,
  Trophy,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Edit2,
  Ban,
  RotateCcw,
  Minus,
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
import ExpandableAction from "../components/ui/ExpandableAction.jsx";
import { debounce } from "../utils/debounce.jsx";
import { CopyButton } from "../components/ui/CopyButton.jsx";
import { Field } from "../components/ui/Field.jsx";
import { TableHeader } from "../components/ui/TableHeader.jsx";
import { TableBody } from "../components/ui/TableBody.jsx";

const DatabasePlate = ({ theme, locale, lang, themeClasses, selectedGame, setSelectedGame, sidePanelCollapsed }) => {
  // Notes in 1 request to database
  const limit = 5;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const nameMessengerPlatform = "Discord";
  const nameTournamentPlatform = "Startgg";

  const sizeColumnOfMMRPoints = 45;

  const prepareColumns = (columns) => {
    const totalSize = columns.reduce(
      (sum, column) => sum + column.size,
      0
    );

    return columns.map((column) => ({
      ...column,
      width: `${(column.size / totalSize) * 100}%`,
    }));
  };

const normalColumns = [
  {
    key: "nickname",
    size: sidePanelCollapsed ? 0.85 : 0.55,
    header: locale.Table.Nickname,
    render: (p) => (
      <span
        className={`font-black text-[13px] italic tracking-tight break-all block ${
          p.isBanned === "banned" ? "text-red-500" : ""
        }`}
      >
        {p.gameNickname || p.messengerLogin || "N/D"}
      </span>
    ),
  },

  {
    key: "gameID",
    size: sidePanelCollapsed ? 0.75 : 0.45,
    header: locale.Table.GameID,
    render: (p) => (
      <span className="font-mono text-slate-500 font-bold block">
        {p.gameId === "N/D"
          ? locale.AddButton.AddModalWindow.ListRegions.ND
          : p.gameId}
      </span>
    ),
  },

  {
    key: "region",
    size: sidePanelCollapsed ? 0.75 : 0.45,
    header: locale.Table.Region,
    render: (p) => (
      <span
        className={`inline-block px-2 py-1 rounded-lg text-[9px] font-black text-left ${
          theme === "dark" ? "bg-white/5" : "bg-slate-100"
        }`}
      >
        {regionsMap[p.region] === "undefined" ||
        regionsMap[p.region] === ""
          ? locale.AddButton.AddModalWindow.ListRegions.ND
          : regionsMap[p.region]}
      </span>
    ),
  },

  {
    key: "language",
    size: sidePanelCollapsed ? 0.4 : 0.2,
    header: locale.Table.Language,
    tdClassName:
      "font-bold italic opacity-70 uppercase whitespace-nowrap",
    render: (p) =>
      p.locale === "N/D"
        ? locale.AddButton.AddModalWindow.ListRegions.ND
        : p.locale,
  },

  {
    key: "mmr",
    size: sidePanelCollapsed ? 0.4 : 0.25,
    header: locale.Table.Rating,
    thClassName: "text-blue-500",
    render: (p) => (
      <>
        <input
          type="number"
          value={p.rating || 0}
          min="0"
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;

            if (val >= 0) {
              handleLocalRatingChange(
                p.id,
                val,
                p.gameNickname
              );
            }
          }}
          className="bg-transparent text-blue-500 font-black text-sm italic outline-none border-b border-transparent focus:border-blue-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{
            width: `${sizeColumnOfMMRPoints}%`,
          }}
        />

        <div className="flex gap-1 mt-1">
          <button
            onClick={() =>
              handleUpdateRating(
                p.id,
                selectedGame,
                Math.max(0, (p.rating || 0) + 10),
                p.gameNickname
              )
            }
            className="w-7 h-7 flex items-center justify-center bg-green-600/10 text-green-500 rounded-lg border border-green-600/20 hover:bg-green-600/20 transition-colors"
          >
            <Plus size={12} />
          </button>

          <button
            onClick={() =>
              handleUpdateRating(
                p.id,
                selectedGame,
                Math.max(0, (p.rating || 0) - 10),
                p.gameNickname
              )
            }
            className="w-7 h-7 flex items-center justify-center bg-red-600/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Minus size={12} />
          </button>
        </div>
      </>
    ),
  },

  {
    key: "platforms",
    size: sidePanelCollapsed ? 0.7 : 0.55,
    header: locale.Table.Contacts,
    render: (p) => (
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex flex-col text-xs font-bold whitespace-nowrap leading-tight min-w-0">
          <span className="truncate text-blue-500 font-black">
            {nameTournamentPlatform}
          </span>

          <span className="opacity-60 text-[10px] truncate">
            {`${locale.AddButton.AddContactOfMessenger.Login}: ${
              p.tournamentPlatformLogin === "N/D" ||
              p.tournamentPlatformLogin === ""
                ? locale.AddButton.AddModalWindow.ListRegions.ND
                : p.tournamentPlatformLogin
            }`}
          </span>

          <span className="text-purple-500 font-black mt-1">
            {nameMessengerPlatform}
          </span>

          <span className="opacity-60 text-[10px] truncate">
            {`${locale.AddButton.AddDataOfTourneyPlatform.Nickname}: ${
              p.messengerLogin === "N/D" ||
              p.messengerLogin === ""
                ? locale.AddButton.AddModalWindow.ListRegions.ND
                : p.messengerLogin
            }`}
          </span>
        </div>

        <CopyButton text={getParticipantCopyText(p)} />
      </div>
    ),
  },

  {
    key: "updateDate",
    size: sidePanelCollapsed ? 0.5 : 0.35,
    header: locale.Table.UpdatedAt,
    tdClassName:
      "opacity-60 italic text-[10px] whitespace-nowrap",
    render: (p) => getRelativeTime(p.updatedAt),
  },

  {
    key: "control",
    size: sidePanelCollapsed ? 0.45 : 0.35,
    header: locale.Table.Management.Label,
    render: (p) => (
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => handleOpenEditModal(p)}
          className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
        >
          <Edit2 size={11} />
          {locale.Table.Management.Edit}
        </button>

        {p.isBanned === "banned" ? (
          <button
            onClick={() =>
              triggerParticipantAction(p, "unban")
            }
            className="w-full flex items-center justify-center gap-2 p-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
          >
            <ShieldCheck size={11} />
            {locale.Table.Management.Unban}
          </button>
        ) : (
          <button
            onClick={() =>
              triggerParticipantAction(p, "ban")
            }
            className="w-full flex items-center justify-center gap-2 p-2 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
          >
            <Ban size={11} />
            {locale.Table.Management.Ban}
          </button>
        )}

        <button
          onClick={() =>
            triggerParticipantAction(p, "delete")
          }
          className="w-full flex items-center justify-center gap-2 p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
        >
          <Trash2 size={11} />
          {locale.Table.Management.Delete}
        </button>
      </div>
    ),
  },
];

const bannedColumns = [
  {
    key: "nickname",
    size: 1,
    header: locale.Table.Nickname,
    render: (p) => (
      <span
        className={`font-black text-[13px] italic tracking-tight break-all block ${
          p.isBanned === "banned" ? "text-red-500" : ""
        }`}
      >
        {p.gameNickname || p.messengerLogin || "N/D"}
      </span>
    ),
  },

  {
    key: "gameID",
    size: 1,
    header: locale.Table.GameID,
    render: (p) => (
      <span className="font-mono text-slate-500 font-bold block">
        {p.gameId === "N/D"
          ? locale.AddButton.AddModalWindow.ListRegions.ND
          : p.gameId}
      </span>
    ),
  },

  {
    key: "typeBan",
    size: 1,
    header: locale.Table.ReasonBan,
    thClassName: "text-red-500",
    tdClassName: "text-red-500 font-bold italic truncate",
    render: (p) => p.typeBan || "Ban",
  },

  {
    key: "descriptionBan",
    size: 2,
    header: locale.Table.DescriptionBan,
    thClassName: "text-amber-500/80",
    render: (p) => (
      <div
        className={`text-[10px] leading-snug opacity-80 whitespace-normal break-words ${
          theme === "dark"
            ? "text-slate-300"
            : "text-slate-600"
        }`}
      >
        {p.reason || locale.Table.EmptyDescription}
      </div>
    ),
  },

  {
    key: "bannedAt",
    size: 1,
    header: locale.Table.DateBan,
    thClassName: "text-slate-400",
    tdClassName:
      "opacity-70 italic whitespace-nowrap",
    render: (p) => getRelativeTime(p.bannedAt),
  },

  {
    key: "expiredAt",
    size: 1,
    header: locale.Table.IsExpiring,
    thClassName: "text-slate-400",
    tdClassName: "font-bold whitespace-nowrap",
    render: (p) =>
      p.expiresAt &&
      !p.expiresAt.startsWith("0001") ? (
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
          {locale.AddButton.AddBanFields.PermanentBanLabel}
        </span>
      ),
  },

  {
    key: "control",
    size: 0.7,
    header: locale.Table.Management.Label,
    render: (p) => (
      <div className="flex flex-col gap-1.5 py-2">
        <button
          onClick={() => handleOpenEditModal(p)}
          className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-[0.725rem] font-black uppercase"
        >
          <Edit2 size={11} />
          {locale.Table.Management.Edit}
        </button>

        <button
          onClick={() =>
            triggerParticipantAction(p, "unban")
          }
          className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg font-black uppercase text-[0.725rem] bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white"
        >
          <ShieldOff size={11} />
          {locale.Table.Management.Unban}
        </button>

        <button
          onClick={() =>
            triggerParticipantAction(p, "delete")
          }
          className="flex items-center justify-center gap-1.5 px-2 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg font-black uppercase text-[0.725rem] w-full"
        >
          <Trash2 size={11} />
          {locale.Table.Management.Delete}
        </button>
      </div>
    ),
  },
];

const columns = prepareColumns(
  activeFilter === "banned"
    ? bannedColumns
    : normalColumns
);

  // Statements for UI
  const [players, setPlayers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [totalCountAll, setTotalCountAll] = useState(0);
  const [totalCountRating, setTotalCountRating] = useState(0);
  const [totalCountBanned, setTotalCountBanned] = useState(0);

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
    debouncedRatingUpdate(participantId, selectedGame, val, nickname);
  };

  // Handler for update rating
  const handleUpdateRating = async (
    participantId,
    gameName,
    newRating,
    nickname,
  ) => {
    const logActionUpdateRating = locale.Table.LogsActions.UpdateRating;
    const logActionErrParts = locale.Table.LogsActions.Err.split("%v");

    console.log("[Rating] handleUpdateRating called:", {
      participantId,
      participantIdType: typeof participantId,
      gameName,
      gameNameType: typeof gameName,
      newRating,
      newRatingType: typeof newRating,
      nickname,
      nicknameType: typeof nickname,
    });

    try {
      console.log("[Rating] Calling EditParticipantStatsRating:", {
        participantId,
        gameName,
        newRating,
      });

      const result = await EditParticipantStatsRating(
        participantId,
        gameName,
        newRating,
      );

      console.log("[Rating] EditParticipantStatsRating success:", result);

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, rating: newRating }
            : p,
        ),
      );

      console.log("[Rating] Player state updated:", {
        participantId,
        newRating,
      });
    } catch (err) {
      console.error("[Rating] EditParticipantStatsRating ERROR:", err);

      console.error("[Rating] Arguments at error:", {
        participantId,
        participantIdType: typeof participantId,
        gameName,
        gameNameType: typeof gameName,
        newRating,
        newRatingType: typeof newRating,
        nickname,
        nicknameType: typeof nickname,
      });

      console.error(
        `${logActionErrParts[0]} ${nickname || "User"}`,
      );
    }
  };

  // Handler for rating values
  const handleUpdateRatingRef = useRef(handleUpdateRating);
  handleUpdateRatingRef.current = handleUpdateRating;

  // Debounce for rating values
  const debouncedRatingUpdate = useMemo(
    () =>
      debounce((participantId, gameName, newValue, nickname) => {
        handleUpdateRatingRef.current(participantId, gameName, newValue, nickname);
      }, 600),
    [],
  );

  const fetchTotalCounts = async () => {
    try {
      const [
        allResponse,
        ratingResponse,
        bannedResponse,
      ] = await Promise.all([
        GetParticipants(
          nameMessengerPlatform,
          nameTournamentPlatform,
          selectedGame,
          1,
          0,
          "",
        ),

        GetParticipantsSortedByRatingList(
          nameMessengerPlatform,
          nameTournamentPlatform,
          selectedGame,
          1,
          0,
          "",
        ),

        GetBanned(
          nameMessengerPlatform,
          nameTournamentPlatform,
          selectedGame,
          1,
          0,
          "",
        ),
      ]);

      setTotalCountAll(allResponse?.totalCount ?? 0);
      setTotalCountRating(ratingResponse?.totalCount ?? 0);
      setTotalCountBanned(bannedResponse?.totalCount ?? 0);
    } catch (err) {
      console.error(
        `Failed to get total counts: ${err.message || err}`,
      );
    }
  };

  // Function of pagination
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

      if (activeFilter === "banned") {
        setTotalCountBanned(total);
      } else if (activeFilter === "rating") {
        setTotalCountRating(total);
      } else {
        setTotalCountAll(total);
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

  useEffect(() => {
    if (
      loading ||
      players.length === 0 ||
      players.length >= totalCount
    ) {
      return;
    }

    const container = bodyScrollRef.current;

    if (!container) {
      return;
    }

    // If table not create a scroll,
    // then text page not enogth for fill case.
    if (container.scrollHeight <= container.clientHeight) {
      fetchDataRef.current(true);
    }
  }, [players.length, totalCount, loading]);

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

  // Update count for every filter
  useEffect(() => {
    fetchTotalCounts();
  }, [
    selectedGame,
    nameMessengerPlatform,
    nameTournamentPlatform,
  ]);

  // Filter list of players for table
  const filteredPlayers = useMemo(() => {
    let list = players ? [...players] : [];

    if (activeFilter === "banned") {
      return list;
    }

    if (activeFilter === "rating") {
      return list
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
  console.log("RATING DEBUG", {
  activeFilter,
  players: players.length,
  filteredPlayers: filteredPlayers.length,
  totalCount,
  ratings: players.map((p) => ({
    nickname: p.nickname,
    rating: p.rating,
    status: p.status,
    isBanned: p.isBanned,
  })),
});

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="w-full h-full min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Main Action Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
            <ExpandableAction
              icon={
                activeFilter === "banned" ? (
                  <Ban size={26} />
                ) : (
                  <Plus size={26} />
                )
              }
              collapsedClassName={
                activeFilter === "banned"
                  ? "bg-red-600 border border-red-500/30"
                  : "bg-blue-600 text-white"
              }
              items={[
                {
                  id: "add",
                  icon: addButtonConfig.icon,
                  label: addButtonConfig.text,
                  onClick: addButtonConfig.action,
                  flex: 1,
                  className: `text-white ${
                    activeFilter === "banned"
                      ? "bg-red-700 hover:bg-red-600"
                      : "bg-blue-700 hover:bg-blue-500"
                  }`,
                },
                {
                  id: "import",
                  icon: <FileUp size={15} className="animate-pulse" />,
                  label: locale.AddButton.ImportFile.Label,
                  onClick: handleImportFile,
                  flex: 1.2,
                  labelClassName:
                    "text-[7px] font-black uppercase tracking-wider mt-1 text-center leading-tight",
                  className: `border py-3 px-1 ${
                    theme === "dark"
                      ? activeFilter === "banned"
                        ? "bg-red-950/20 border-red-500/20 text-red-400 hover:bg-red-900/30"
                        : "bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20"
                      : activeFilter === "banned"
                        ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                        : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                  }`,
                },
              ]}
            />
            {/* TODO: Add export database/list of participants */}
            {/* <ExpandableAction
              icon={<FolderUpIcon size={26} />}
              width={activeFilter === "all" ? "120px" : undefined}
              collapsedClassName="bg-blue-600 text-white"
              items={[
                {
                  id: "database",
                  icon: <DatabaseIcon size={15} />,
                  label: "База данных",
                  // onClick: handleExportDatabase,
                  flex: 1,
                  className:
                    "text-white bg-blue-700 hover:bg-blue-500",
                },
                ...(activeFilter !== "all"
                  ? [
                      {
                        id: activeFilter,
                        icon:
                          activeFilter === "rating" ? (
                            <List size={15} />
                          ) : (
                            <ListCheck size={15} />
                          ),
                        label:
                          activeFilter === "rating"
                            ? "Список рейтинга"
                            : "Бан-лист",
                        // onClick:
                        //   activeFilter === "rating"
                        //     ? handleExportRating
                        //     : handleExportBanned,
                        flex: 1.2,
                        labelClassName:
                          "text-[7px] font-black uppercase tracking-wider mt-1 text-center leading-tight",
                        className:
                          "border py-3 px-1 bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20",
                      },
                    ]
                  : []),
              ]}
            /> */}
            {activeFilter === "rating" && (
              <ExpandableAction
                icon={<RotateCcw size={26} />}
                width="120px"
                collapsedClassName={
                  theme === "dark"
                    ? "bg-red-600/10 border border-red-500/20 text-red-400"
                    : "bg-red-50 border border-red-200 text-red-600"
                }
                items={[
                  {
                    id: "reset-rating",
                    icon: (
                      <RotateCcw
                        size={14}
                        className="group-hover:rotate-[-180deg] transition-transform duration-500"
                      />
                    ),
                    label: locale.ResetRatingButton.Label,
                    onClick: () =>
                      triggerParticipantAction(null, "reset_rating_all"),
                    className:
                      theme === "dark"
                        ? "bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white"
                        : "bg-red-50 hover:bg-red-600 text-red-600 hover:text-white",
                  },
                ]}
              />
            )}
            
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
                className={`w-full pl-12 pr-6 h-[56px] rounded-xl border text-[12px] font-bold outline-none  focus:ring-2 focus:ring-blue-600/20 ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-slate-200"}`}
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
                  label: `${locale.Filters.All} (${totalCountAll})`,
                  icon: <LayoutGrid size={14} />,
                },
                {
                  id: "rating",
                  label: `${locale.Filters.Rating} (${totalCountRating})`,
                  icon: <Trophy size={14} />,
                },
                {
                  id: "banned",
                  label: `${locale.Filters.BanList} (${totalCountBanned})`,
                  icon: <ShieldAlert size={14} />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-2 px-4 h-full rounded-lg text-[10px] font-black uppercase italic  whitespace-nowrap ${
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
            <table className="w-full text-left text-[11px] table-fixed min-w-[800px]">
              <TableHeader
                columns={columns}
                theme={theme}
              />  
            </table>
          </div>

          {/* Body table */}
          <div
            ref={bodyScrollRef}
            onScroll={() => syncScroll("body")}
            id="table-scroll-container"
            className="flex-1 min-h-0 overflow-auto custom-scrollbar"
          >
            <table className="w-full text-left text-[11px] table-fixed min-w-[800px] border-collapse">
              <TableBody
                players={filteredPlayers}
                columns={columns}
                locale={locale}
                loading={loading}
              />
            </table>
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
