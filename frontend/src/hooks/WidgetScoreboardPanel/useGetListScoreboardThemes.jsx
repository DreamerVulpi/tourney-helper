import { useEffect, useState } from "react";
import { GetListScoreboardThemes } from "../../../wailsjs/go/application/App.js";

const DEFAULT_THEME = {
  value: "default",
  label: "Default",
};

export function useGetListScoreboardThemes() {
  const [themes, setThemes] = useState([DEFAULT_THEME]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await GetListScoreboardThemes();

        if (!list || list.length === 0) {
          if (!cancelled) setThemes([DEFAULT_THEME]);
          return;
        }

        const hasDefault = list.some(
          (name) => String(name).toLowerCase() === "default",
        );

        const options = list.map((name) => ({
          value: name,
          label: formatThemeLabel(name),
        }));

        if (!hasDefault) {
          options.unshift(DEFAULT_THEME);
        } else {
          options.sort((a, b) => {
            if (String(a.value).toLowerCase() === "default") return -1;
            if (String(b.value).toLowerCase() === "default") return 1;
            return a.value.localeCompare(b.value);
          });
        }

        if (!cancelled) setThemes(options);
      } catch (err) {
        console.error("Failed to load scoreboard themes:", err);
        if (!cancelled) setThemes([DEFAULT_THEME]);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return themes;
}

function formatThemeLabel(name) {
  return String(name)
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
