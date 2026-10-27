import {
  GetListProfiles,
  GetActiveProfileName,
  SwitchProfile,
  AddProfile,
  DeleteProfile,
  DuplicateProfile,
  RenameProfile,
  ExportProfile,
  ImportProfile,
} from "../../../wailsjs/go/application/App";

export const exportProfile = (name) => ExportProfile(name);
export const importProfile = () => ImportProfile();

export const listProfiles = () => GetListProfiles();
export const getActiveProfile = () => GetActiveProfileName();
export const switchProfile = (name) => SwitchProfile(name);
export const addProfile = (name) => AddProfile(name);
export const deleteProfile = (name) => DeleteProfile(name);
export const duplicateProfile = (source, target) => DuplicateProfile(source, target);
export const renameProfile = (oldName, newName) => RenameProfile(oldName, newName);