import { useCallback, useEffect, useState } from "react";
import { GetListPlanks } from "../../../wailsjs/go/application/App.js";

function stripExtension(name) {
  return String(name || "").replace(/\.[^.]+$/, "");
}

export function useGetListPlanks() {
  const [planks, setPlanks] = useState([]);

  const load = useCallback(async () => {
    try {
      const list = await GetListPlanks();

      if (!Array.isArray(list)) {
        setPlanks([]);
        return;
      }

      const options = list
        .filter((plank) => plank?.name)
        .map((plank) => ({
          value: plank.name,
          label: stripExtension(plank.name),
          dataUrl: plank.dataUrl || "",
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setPlanks(options);
    } catch (err) {
      console.error("Failed to load planks:", err);
      setPlanks([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { planks, reload: load };
}
