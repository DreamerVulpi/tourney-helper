import { useCallback, useEffect, useState } from "react";
import { GetListIcons } from "../../../wailsjs/go/application/App.js";

function stripExtension(name) {
  return String(name || "").replace(/\.[^.]+$/, "");
}

export function useGetListIcons() {
  const [icons, setIcons] = useState([]);

  const load = useCallback(async () => {
    try {
      const list = await GetListIcons();

      if (!Array.isArray(list)) {
        setIcons([]);
        return;
      }

      const options = list
        .filter((icon) => icon?.name)
        .map((icon) => ({
          value: icon.name,
          label: stripExtension(icon.name),
          dataUrl: icon.dataUrl || "",
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setIcons(options);
    } catch (err) {
      console.error("Failed to load icons:", err);
      setIcons([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { icons, reload: load };
}
