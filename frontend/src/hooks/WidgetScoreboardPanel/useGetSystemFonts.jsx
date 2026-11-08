import { useEffect, useState } from "react";
import { GetSystemFonts } from "../../../wailsjs/go/application/App.js";

export function useGetSystemFonts() {
  const [fonts, setFonts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await GetSystemFonts();
        if (!cancelled && Array.isArray(list)) {
          setFonts(list.filter(Boolean));
        }
      } catch (err) {
        console.error("Failed to load system fonts:", err);
        if (!cancelled) setFonts([]);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return fonts;
}
