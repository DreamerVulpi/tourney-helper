import { useEffect, useState } from "react";
import { GetListFlags } from "../../../wailsjs/go/application/App.js";
import { flagCode3 } from "../../utils/flagCodes.js";

const EMPTY_FLAG_NAMES = {};
const MAX_LABEL_LENGTH = 20;

function truncateLabel(label) {
  if (!label || label.length <= MAX_LABEL_LENGTH) return label;
  return `${label.slice(0, MAX_LABEL_LENGTH - 3)}...`;
}

export function useGetListFlags(flagNames = EMPTY_FLAG_NAMES) {
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await GetListFlags();

        if (!Array.isArray(list)) {
          if (!cancelled) setFlags([]);
          return;
        }

        const options = list
          .filter((flag) => flag?.code)
          .map((flag) => {
            const label =
              flagNames?.[flag.code] ||
              flag.name ||
              flag.code.toUpperCase();

            return {
              value: flag.code,
              label,
              shortLabel: truncateLabel(label),
              searchText: [flag.name, flag.code, flagCode3(flag.code)].filter(Boolean).join(" "),
              dataUrl: flag.dataUrl || "",
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        if (!cancelled) setFlags(options);
      } catch (err) {
        console.error("Failed to load flags:", err);
        if (!cancelled) setFlags([]);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [flagNames]);

  return flags;
}
