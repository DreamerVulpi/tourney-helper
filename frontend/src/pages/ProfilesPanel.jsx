import React, { useCallback, useMemo } from "react";
import {
  UserPlus,
  UserMinus,
  CopyPlus,
  Share,
} from "lucide-react";

import { Field } from "../components/ui/Field.jsx";
import ExpandableAction from "../components/ui/ExpandableAction";
import PanelTemplate from "../components/layout/PanelTemplate";
import { useAppStore } from "../store/useAppStore";
import { useThemeClasses } from "../hooks/App/useThemeClasses";
import { getThemeClasses } from "../utils/themeClasses";
import { useProfiles } from "../hooks/Profiles/useProfiles";

const PROFILE_NAME_RE = /^[A-Za-z0-9 _\-()#\u0400-\u04FF]+$/;

const ProfilesPanel = ({ locale }) => {
  const themeClasses = useThemeClasses(getThemeClasses);

  const {
    profiles, active, loading, error,
    switchTo, add, remove, duplicate, rename,
  } = useProfiles();

  const validateProfileName = useCallback((newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return "Имя не может быть пустым";
    if (trimmed.length > 17) return "Слишком длинное имя";
    if (!PROFILE_NAME_RE.test(trimmed)) return "Недопустимые символы";
    if (trimmed !== active && profiles.some((p) => p.name === trimmed)) {
      return "Такое имя уже существует";
    }
    return null;
  }, [active, profiles]);

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
    } catch {
      window.alert("Не удалось создать профиль");
    }
  }, [profiles, add]);

  const handleDeleteProfile = useCallback(async () => {
    if (!active) return;
    if (!window.confirm(`Удалить профиль «${active}»?`)) return;
    try {
      await remove(active);
    } catch {
      window.alert("Не удалось удалить профиль");
    }
  }, [active, remove]);

  const handleDuplicateProfile = useCallback(async () => {
    if (!active) return;
    const target = window.prompt("Имя нового профиля", `${active} copy`);
    if (!target?.trim() || target.trim() === active) return;
    try {
      await duplicate(active, target.trim());
    } catch {
      window.alert("Не удалось скопировать профиль");
    }
  }, [active, duplicate]);

  const handleSwitchProfile = useCallback(async (vals) => {
    const name = vals[0];
    if (!name || name === active) return;
    try {
      await switchTo(name);
    } catch {
      window.alert("Не удалось переключить профиль");
    }
  }, [active, switchTo]);

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
        {/* Статусы */}
        {loading && <div className="text-xs opacity-60">Загрузка…</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}

        {/* Выбор/переименование профиля */}
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

        {/* Кнопки действий */}
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
              onClick: () => { /* TODO: export to zip */ },
            }]}
          />
        </div>
      </div>
    </PanelTemplate>
  );
};

export default ProfilesPanel;