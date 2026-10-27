import { useCallback, useEffect, useState } from "react";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import * as api from "./profiles";
import { hydrateFromBackend } from "../Profiles/hydrateFromBackend";

export function useProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, act] = await Promise.all([
        api.listProfiles(),
        api.getActiveProfile(),
      ]);
      console.log("[useProfiles] list:", list, "active:", act);
      setProfiles(list ?? []);
      setActive(act ?? "");
    } catch (e) {
      console.error("[useProfiles] error:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const cancel = EventsOn("profile:changed", async (profileName) => {
      console.log("[useProfiles] profile:changed ->", profileName);

      setActive(profileName);
      await refresh();

      try {
        // markLoaded: false — приложение уже загружено
        await hydrateFromBackend({ markLoaded: false });
      } catch (e) {
        console.error("[useProfiles] failed to reload configs:", e);
      }
    });

    return () => {
      if (typeof cancel === "function") cancel();
    };
  }, [refresh]);

  const switchTo = useCallback(async (name) => {
    setError(null);
    try {
      await api.switchProfile(name);
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []);

  const add = useCallback(async (name) => {
    setError(null);
    try {
      await api.addProfile(name);
      await refresh();
      setActive(name);
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, [refresh]);

  const remove = useCallback(async (name) => {
    setError(null);
    try {
      await api.deleteProfile(name);
      await refresh();
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, [refresh]);

  const duplicate = useCallback(async (source, target) => {
    setError(null);
    try {
      await api.duplicateProfile(source, target);
      await refresh();
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, [refresh]);

  const rename = useCallback(async (oldName, newName) => {
    setError(null);
    try {
      await api.renameProfile(oldName, newName);
      await refresh();
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, [refresh]);

  const exportCurrent = useCallback(async (name) => {
    return await api.exportProfile(name);
  }, []);

  const importNew = useCallback(async () => {
    setError(null);
    try {
      const importedName = await api.importProfile();
      if (importedName) {
        await refresh();
      }
      return importedName;
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, [refresh]);

  return { profiles, active, loading, error, refresh, switchTo, add, remove, duplicate, rename, exportCurrent, importNew };
}