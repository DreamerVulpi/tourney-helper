import { useCallback, useEffect, useState } from "react";
import { GetListLogos } from "../../../wailsjs/go/application/App.js";

function stripExtension(name) {
  return String(name || "").replace(/\.[^.]+$/, "");
}

export function useGetListLogos() {
  const [logos, setLogos] = useState([]);

  const load = useCallback(async () => {
    try {
      const list = await GetListLogos();

      if (!Array.isArray(list)) {
        setLogos([]);
        return;
      }

      const options = list
        .filter((logo) => logo?.name)
        .map((logo) => ({
          value: logo.name,
          label: stripExtension(logo.name),
          dataUrl: logo.dataUrl || "",
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setLogos(options);
    } catch (err) {
      console.error("Failed to load logos:", err);
      setLogos([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { logos, reload: load };
}
