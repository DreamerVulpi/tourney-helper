import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  UserPlus,
  CopyPlus,
  Share,
  Trash2,
  FileDown,
  FileUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import PanelTemplate from "../components/layout/PanelTemplate";import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import PromptModal from "../components/modals/PromptModal.jsx";
import { useThemeClasses } from "../hooks/App/useThemeClasses";
import { getThemeClasses } from "../utils/themeClasses";
import { useProfiles } from "../hooks/Profiles/useProfiles";
import { useAppStore } from "../store/useAppStore";
import { ValidationModal } from "../components/ValidationModal.jsx";
import { SuccessModal } from "../components/modals/SuccessModal.jsx";
import { TableHeader } from "../components/ui/TableHeader.jsx";
import { TableBody } from "../components/ui/TableBody.jsx";

const PROFILE_NAME_RE = /^[A-Za-z0-9 _\-()#\u0400-\u04FF]+$/;
const PROFILES_PAGE_SIZE = 5;

const ToolbarButton = ({ icon, label, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex shrink-0 items-center justify-center gap-2 h-11 px-4 rounded-xl
      text-[10px] font-black uppercase italic tracking-wider whitespace-nowrap
      transition-colors ${className}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const IconAction = ({ icon, label, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`flex h-8 w-8 items-center justify-center rounded-lg border
      transition-colors ${className}`}
  >
    {icon}
  </button>
);

const ProfilesPanel = ({ locale }) => {
  const theme = useAppStore ((s) => s.theme);
  const lang = useAppStore((s) => s.lang);
  const themeClasses = useThemeClasses(getThemeClasses);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState("");
  const [duplicatePromptOpen, setDuplicatePromptOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const confirmMsgParts = locale.ValidationProfile?.ConfirmMsg?.split("%v");

  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);

  const showSuccess = useCallback((title, message) => {
    setSuccessTitle(title || locale.ImportSuccessTitle);
    setSuccessMessage(message || locale.ImportSuccessMsg);
    setSuccessOpen(true);
  }, [locale]);

  const showError = useCallback((msg) => {
    setErrorMessage(msg);
    setErrorOpen(true);
  }, []);

  const {
    profiles, active,
    switchTo, add, remove, duplicate,
    exportCurrent, importNew,
    exportWidgetsContent, importWidgetsContent,
  } = useProfiles();

  // --- Экспорт ---
  const handleExport = useCallback(async (profileName) => {
    const target = profileName || active;
    if (!target) return;
    try {
      const savedPath = await exportCurrent(target);
      if (savedPath) {
        showSuccess(
          locale.ExportSuccessTitle,
          `${locale.ExportSuccessMsg}\n${savedPath}`,
        );
      }
    } catch (e) {
      showError(String(e?.message ?? e ?? "Unable to export the profile"));
    }
  }, [active, exportCurrent, showError, showSuccess, locale]);

  // --- Импорт ---
  const handleImport = useCallback(async () => {
    try {
        const name = await importNew();
        if (!name) return;
        showSuccess(locale.ImportSuccessTitle, locale.ImportSuccessMsg);
    } catch (e) {
        console.error("[handleImport] error:", e);
        showError(String(e?.message ?? e ?? "Unable to import the profile"));
    }
  }, [importNew, showError, showSuccess, locale]);

  // --- Виджеты: контент ---
  const handleExportWidgetsContent = useCallback(async () => {
    try {
      const savedPath = await exportWidgetsContent();
      if (savedPath) {
        showSuccess(
          locale.ExportSuccessTitle,
          `${locale.ExportWidgetsContentMsg}\n${savedPath}`,
        );
      }
    } catch (e) {
      showError(String(e?.message ?? e ?? "Unable to export widgets content"));
    }
  }, [exportWidgetsContent, showError, showSuccess, locale]);

  const handleImportWidgetsContent = useCallback(async () => {
    try {
      const path = await importWidgetsContent();
      if (path) {
        showSuccess(
          locale.ImportSuccessTitle,
          locale.ImportWidgetsContentMsg,
        );
      }
    } catch (e) {
      showError(String(e?.message ?? e ?? "Unable to import widgets content"));
    }
  }, [importWidgetsContent, showError, showSuccess, locale]);

  const validateProfileName = useCallback((newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return locale.ValidationProfile.NameCannotBeEmpty;
    if (trimmed.length > 17) return locale.ValidationProfile.NameTooLong;
    if (!PROFILE_NAME_RE.test(trimmed)) return locale.ValidationProfile.InvalidCharacters;
    if (trimmed !== active && profiles.some((p) => p.name === trimmed)) {
      return locale.ValidationProfile?.NameAlreadyExists;
    }
    return null;
  }, [active, profiles, locale]);

  const nextProfileName = (existing) => {
    let n = 1;
    while (existing.includes(`Profile #${n}`)) n++;
    return `Profile #${n}`;
  };

  const handleAddProfile = useCallback(async () => {
  const name = nextProfileName(profiles.map((p) => p.name));
    if (!name?.trim()) return;
    try {
      await add(name.trim());
    } catch (e) {
      showError(String(e?.message ?? e ?? locale.ValidationProfile.UnableCreateProfile));
    }
  }, [profiles, add, showError]);

  const confirmDelete = useCallback(async () => {
    const target = profileToDelete || active;
    if (!target) return;
    setPendingAction("delete");
    try {
      await remove(target);
      setDeleteConfirmOpen(false);
      setProfileToDelete("");
    } catch (e) {
      showError(String(e?.message ?? e ?? locale.ValidationProfile.UnableDeleteProfile));
    } finally {
      setPendingAction(null);
    }
  }, [active, profileToDelete, remove, showError, locale]);

  const confirmDuplicate = useCallback(async (target) => {
    const source = duplicateSource || active;
    if (!source) return;
    setPendingAction("duplicate");
    try {
      await duplicate(source, target);
      setDuplicatePromptOpen(false);
      setDuplicateSource("");
    } catch (e) {
      showError(String(e?.message ?? e ?? locale.ValidationProfile.UnableCopyProfile));
    } finally {
      setPendingAction(null);
    }
  }, [active, duplicateSource, duplicate, showError, locale]);

  const handleSwitchRow = useCallback(async (profile) => {
    if (!profile?.name || profile.name === active) return;
    try {
      await switchTo(profile.name);
    } catch (e) {
      showError(String(e?.message ?? e ?? locale.ValidationProfile.UnableSwitchProfile));
    }
  }, [active, switchTo, showError, locale]);

  const handleDeleteProfile = useCallback((profileName) => {
    const target = profileName || active;
    if (!target) return;
    setProfileToDelete(target);
    setDeleteConfirmOpen(true);
  }, [active]);

  const handleDuplicateProfile = useCallback((profileName) => {
    const source = profileName || active;
    if (!source) return;
    setDuplicateSource(source);
    setDuplicatePromptOpen(true);
  }, [active]);

  const formatDateTime = useCallback((value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1) return "—";
    return date.toLocaleString(lang === "EN" ? "en-US" : "ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lang]);

  const columns = useMemo(() => [
    {
      key: "name",
      size: 2,
      header: locale.ColumnProfileName,
      render: (p) => (
        <span className="flex items-center gap-2 font-black text-[13px] italic tracking-tight break-all">
          {p.name}
          {p.name === active && (
            <span
              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-blue-600/20 text-blue-400"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {locale.ActiveProfileLabel}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "createdAt",
      size: 1.35,
      header: locale.ColumnCreatedAt,
      tdClassName: "opacity-70 italic text-[11px] whitespace-nowrap",
      render: (p) => formatDateTime(p.createdAt),
    },
    {
      key: "lastOpenedAt",
      size: 1.35,
      header: locale.ColumnLastOpenedAt,
      tdClassName: "opacity-70 italic text-[11px] whitespace-nowrap",
      render: (p) => formatDateTime(p.lastOpenedAt),
    },
    {
      key: "actions",
      size: 0.95,
      header: "",
      render: (p) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <IconAction
            icon={<Trash2 size={13} />}
            label={locale.Delete}
            onClick={() => handleDeleteProfile(p.name)}
            className="bg-red-600/10 text-red-500 border-red-500/20 hover:bg-red-600 hover:text-white"
          />
          <IconAction
            icon={<CopyPlus size={13} />}
            label={locale.Duplicate}
            onClick={() => handleDuplicateProfile(p.name)}
            className="bg-amber-600/10 text-amber-500 border-amber-500/20 hover:bg-amber-600 hover:text-white"
          />
          <IconAction
            icon={<Share size={13} />}
            label={locale.Share}
            onClick={() => handleExport(p.name)}
            className="bg-emerald-600/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-600 hover:text-white"
          />
        </div>
      ),
    },
  ], [
    locale,
    active,
    theme,
    formatDateTime,
    handleDeleteProfile,
    handleDuplicateProfile,
    handleExport,
  ]);

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((p) =>
      String(p.name).toLowerCase().includes(query),
    );
  }, [profiles, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProfiles.length / PROFILES_PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(
    () =>
      filteredProfiles
        .slice(
          (safePage - 1) * PROFILES_PAGE_SIZE,
          safePage * PROFILES_PAGE_SIZE,
        )
        .map((p) => ({ ...p, id: p.name })),
    [filteredProfiles, safePage],
  );

  const emptyTableLocale = useMemo(
    () => ({
      Table: {
        NoData: locale.NoProfilesTitle,
        NoDataAccordingFilters: locale.NoProfilesDescription,
      },
    }),
    [locale],
  );

  const handlePrevPage = useCallback(
    () => setPage((prev) => Math.max(1, prev - 1)),
    [],
  );

  const handleNextPage = useCallback(
    () => setPage((prev) => Math.min(totalPages, prev + 1)),
    [totalPages],
  );

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="w-full flex-1 min-h-0 flex flex-col gap-4 p-4">
        {/* Toolbar: search + actions */}
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
          <div className="flex-1 relative w-full">
            <Search
              size={16}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder={locale.SearchLabel}
              className={`w-full pl-12 pr-6 h-11 rounded-xl border text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-600/20 ${
                theme === "dark"
                  ? "bg-black/40 border-white/10 text-white"
                  : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <ToolbarButton
              icon={<UserPlus size={16} />}
              label={locale.Add}
              onClick={handleAddProfile}
              className="bg-blue-700 hover:bg-blue-600 text-white"
            />
            <ToolbarButton
              icon={<FileUp size={16} />}
              label={locale.ImportProfile}
              onClick={handleImport}
              className="bg-emerald-700 hover:bg-emerald-600 text-white"
            />
            <ToolbarButton
              icon={<FileDown size={16} />}
              label={locale.ExportWidgetsContent}
              onClick={handleExportWidgetsContent}
              className="bg-sky-700 hover:bg-sky-600 text-white"
            />
            <ToolbarButton
              icon={<FileUp size={16} />}
              label={locale.ImportWidgetsContent}
              onClick={handleImportWidgetsContent}
              className="bg-sky-700 hover:bg-sky-600 text-white"
            />
          </div>
        </div>

        {/* Header table */}
        <div
          className={`${
            theme === "dark" ? "bg-[#111]" : "bg-slate-100"
          } border-b border-white/5 overflow-hidden`}
        >
          <table className="w-full text-left text-[11px] table-fixed">
            <TableHeader columns={columns} theme={theme} />
          </table>
        </div>

        {/* Body table */}
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-[11px] table-fixed border-collapse">
            <TableBody
              players={pageRows}
              columns={columns}
              locale={emptyTableLocale}
              loading={false}
              onRowClick={handleSwitchRow}
              rowClassName={(p) =>
                p.name === active
                  ? theme === "dark"
                    ? "bg-blue-600/10"
                    : "bg-blue-50"
                  : ""
              }
            />
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase italic tracking-wider opacity-60">
            {locale.PageLabel} {safePage} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={safePage <= 1}
              title={locale.PreviousPage}
              className={`flex items-center justify-center h-9 px-3 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                theme === "dark"
                  ? "bg-black/30 border-white/10 text-white hover:bg-white/10"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={safePage >= totalPages}
              title={locale.NextPage}
              className={`flex items-center justify-center h-9 px-3 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                theme === "dark"
                  ? "bg-black/30 border-white/10 text-white hover:bg-white/10"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

    <SuccessModal
      isOpen={successOpen}
      onClose={() => setSuccessOpen(false)}
      title={successTitle}
      message={successMessage || locale.ImportSuccessMsg}
      locale={locale}
      themeClasses={themeClasses}
    />
    <ValidationModal
      isOpen={errorOpen}
      onClose={()=> setErrorOpen(false)}
      message={errorMessage}
      locale={locale}
      themeClasses={themeClasses}
    />
    <ConfirmModal
      isOpen={deleteConfirmOpen}
      onClose={() => { setDeleteConfirmOpen(false); setProfileToDelete(""); }}
      onConfirm={confirmDelete}
      loading={pendingAction === "delete"}
      title={`${locale.Delete} «${profileToDelete || active}»?`}
      message={
        <>
          {confirmMsgParts[0]}{" "}
          <span className="text-red-500 font-black italic">{profileToDelete || active}</span>{" "}
          {confirmMsgParts[1]}
        </>
      }
      confirmLabel={locale.ValidationProfile?.ConfirmButtonLabel}
      icon={Trash2}
      iconColor="red"
      iconColorClass="text-red-500"
      danger
      theme={theme}
      themeClasses={themeClasses}
    />

    <PromptModal
      isOpen={duplicatePromptOpen}
      onClose={() => { setDuplicatePromptOpen(false); setDuplicateSource(""); }}
      onConfirm={confirmDuplicate}
      loading={pendingAction === "duplicate"}
      title={locale.DuplicateProfile}
      label={locale.NameNewProfileLabel}
      placeholder={locale.PlaceholderProfile}
      defaultValue={`${duplicateSource || active} copy`}
      confirmLabel={locale.ConfirmButtonDuplicateLabel}
      validate={validateProfileName}
      icon={CopyPlus}
      iconColor="amber"
      theme={theme}
      themeClasses={themeClasses}
    />
    </PanelTemplate>
  );
};

export default ProfilesPanel;