import React, { useState, useCallback, useMemo } from "react";
import {
  UserPlus,
  UserMinus,
  CopyPlus,
  Share,
  Trash2,
  Download,
} from "lucide-react";

import { Field } from "../components/ui/Field.jsx";
import ExpandableAction from "../components/ui/ExpandableAction";
import PanelTemplate from "../components/layout/PanelTemplate";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import PromptModal from "../components/modals/PromptModal.jsx";
import { useThemeClasses } from "../hooks/App/useThemeClasses";
import { getThemeClasses } from "../utils/themeClasses";
import { useProfiles } from "../hooks/Profiles/useProfiles";
import { useAppStore } from "../store/useAppStore";
import { ValidationModal } from "../components/ValidationModal.jsx";
import { SuccessModal } from "../components/modals/SuccessModal.jsx";

const PROFILE_NAME_RE = /^[A-Za-z0-9 _\-()#\u0400-\u04FF]+$/;

const ProfilesPanel = ({ locale }) => {
  const theme = useAppStore ((s) => s.theme);
  const themeClasses = useThemeClasses(getThemeClasses);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [duplicatePromptOpen, setDuplicatePromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const confirmMsgParts = locale.ValidationProfile?.ConfirmMsg?.split("%v");

  const [successOpen, setSuccessOpen] = useState(false);
  const [importedName, setImportedName] = useState("");

  const [errorMessage, setErrorMessage] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);

  const showSuccess = useCallback(() => {
    setSuccessOpen(true);
  }, []);

  const showError = useCallback((msg) => {
    setErrorMessage(msg);
    setErrorOpen(true);
  }, []);

  const {
    profiles, active,
    switchTo, add, remove, duplicate, rename,
    exportCurrent, importNew,
  } = useProfiles();

  // --- Экспорт ---
  const handleExport = useCallback(async () => {
    if (!active) return;
    try {
      const savedPath = await exportCurrent(active);
      if (savedPath) {
        showSuccess(
          locale.ExportSuccessTitle,
          `${locale.ExportSuccessMsg}\n${savedPath}`
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
      setImportedName(name);
      showSuccess();
    } catch (e) {
      showError(String(e?.message ?? e ?? "Unable to import the profile"));
    }
  }, [importNew, showError, showSuccess, locale]);
 
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

  const handleRenameProfile = useCallback(async (oldName, newName) => {
    await rename(oldName, newName);
  }, [rename]);

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
    setPendingAction("delete");
    try {
      await remove(active);
      setDeleteConfirmOpen(false);
    } catch (e) {
      showError(String(e?.message ?? e ?? locale.ValidationProfile.UnableDeleteProfile));
    } finally {
      setPendingAction(null);
    }
  }, [active, remove, showError]);

  const confirmDuplicate = useCallback(async (target) => {
    setPendingAction("duplicate");
    try {
      await duplicate(active, target);
      setDuplicatePromptOpen(false);
    } catch (e) {
      showError(String(e?.message ?? e ?? locale.ValidationProfile.UnableCopyProfile));
    } finally {
      setPendingAction(null);
    }
  }, [active, duplicate, showError]);

  const handleSwitchProfile = useCallback(async (vals) => {
    const name = vals[0];
    if (!name || name === active) return;
    try {
      await switchTo(name);
    } catch (e) {
      showError(String(e?.message ?? e ?? locale.ValidationProfile.UnableSwitchProfile));
    }
  }, [active, switchTo, showError]);

  const handleDeleteProfile = useCallback(() => {
    if (!active) return;
    setDeleteConfirmOpen(true);
  }, [active]);

  const handleDuplicateProfile = useCallback(() => {
    if (!active) return;
    setDuplicatePromptOpen(true);
  }, [active]);

  const profileItems = useMemo(
    () => profiles.map((p) => ({ value: p.name, label: p.name })),
    [profiles]
  );

  const profileValue = useMemo(
    () => (active ? [active] : []),
    [active]
  );

  return (
    <PanelTemplate themeClasses={themeClasses}>
      <div className="p-4 space-y-4">
        <Field
          label={locale.MultiSelectLabel}
          variant="multiselect"
          height="2.5rem"
          value={profileValue}
          items={profileItems}
          validateRename={validateProfileName}
          onRename={handleRenameProfile}
          onChange={handleSwitchProfile}
          single
          searchable
          themeClasses={themeClasses}
          placeholder={locale.Placeholder}
          maxVisible={5}
          locale={locale}
        />
        <div className="flex items-center justify-center gap-4"></div>
        <div className="flex items-center justify-center gap-4">
          <ExpandableAction
            icon={<UserPlus size={20} />}
            collapsedClassName="bg-blue-600 text-white"
            collapsedWidth="36px"
            width="80px"
            items={[{
              id: "add",
              label: locale.Add,
              flex: 1,
              className: "text-white bg-blue-700 hover:bg-blue-500",
              onClick: handleAddProfile,
            }]}
          />
          <ExpandableAction
            icon={<UserMinus size={20} />}
            collapsedClassName="bg-red-600 text-white border border-red-500/30"
            collapsedWidth="36px"
            width="80px"
            items={[{
              id: "delete",
              label: locale.Delete,
              flex: 1,
              className: "text-white bg-red-700 hover:bg-red-600",
              onClick: handleDeleteProfile,
            }]}
          />
          <ExpandableAction
            icon={<CopyPlus size={20} />}
            collapsedClassName="bg-amber-600 text-white border border-amber-500/30"
            collapsedWidth="36px"
            width="80px"
            items={[{
              id: "duplicate",
              label: locale.Duplicate,
              flex: 1,
              className: "text-white bg-amber-700 hover:bg-amber-600",
              onClick: handleDuplicateProfile,
            }]}
          />
          <ExpandableAction
            icon={<Share size={20} />}
            collapsedClassName="bg-emerald-600 text-white border border-emerald-500/30"
            collapsedWidth="36px"
            width="80px"
            items={[{
              id: "share",
              label: locale.Share,
              flex: 1,
              className: "text-white bg-emerald-700 hover:bg-emerald-600",
              onClick: handleExport,
            }]}
          />
          <ExpandableAction
            icon={<Download size={20} />}
            collapsedClassName="bg-emerald-600 text-white border border-emerald-500/30"
            collapsedWidth="36px"
            width="80px"
            items={[{
              id: "share",
              label: locale.ImportProfile,
              flex: 1,
              className: "text-white bg-emerald-700 hover:bg-emerald-600",
              onClick: handleImport,
            }]}
          />
        </div>
      </div>

    <SuccessModal
      isOpen={successOpen}
      onClose={() => setSuccessOpen(false)}
      message={`${locale.ImportSuccessMsg} \"${importedName}\"`}
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
      onClose={() => setDeleteConfirmOpen(false)}
      onConfirm={confirmDelete}
      loading={pendingAction === "delete"}
      title={`${locale.Delete} «${active}»?`}
      message={
        <>
          {confirmMsgParts[0]}{" "}
          <span className="text-red-500 font-black italic">{active}</span>{" "}
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
      onClose={() => setDuplicatePromptOpen(false)}
      onConfirm={confirmDuplicate}
      loading={pendingAction === "duplicate"}
      title={locale.DuplicateProfile}
      label={locale.NameNewProfileLabel}
      placeholder={locale.PlaceholderProfile}
      defaultValue={`${active} copy`}
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