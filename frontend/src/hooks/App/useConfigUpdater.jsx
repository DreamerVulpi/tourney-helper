import { useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";
import { createDefaultBracketSlot, createDefaultScoreboardSlot } from "../../utils/widgetDefaults";

export function useConfigUpdater({
  isLoaded,
  debouncedSaveSettings,
  debouncedSaveTourney,
  debouncedSaveWidgets,
  debouncedSaveAuthorizations,
  debouncedSaveTools,
}) {
  // Достаём сеттеры из стора — не тащим через пропсы
  const setSettings       = useAppStore((s) => s.setSettings);
  const setWidgets        = useAppStore((s) => s.setWidgets);
  const setAuthorizations = useAppStore((s) => s.setAuthorizations);
  const setTools          = useAppStore((s) => s.setTools);

  const updateConfig = useCallback(
    (type, data) => {
      if (!isLoaded) return;

      // ============================================================
      // TOOLS (tools.toml)
      // ============================================================

      if (type === "tools") {
        setTools((prev) => {
          const prevNS = prev?.notificationSystem ?? {};
          const dataNS = data.notificationSystem ?? {};

          // Мерж deliveryClients по platform:
          // - новые/изменённые элементы из dataNS перезаписывают свои platform
          // - элементы, которых нет в dataNS, сохраняются как были
          const prevDelivery = Array.isArray(prevNS.deliveryClients)
            ? prevNS.deliveryClients
            : [];
          const dataDelivery = Array.isArray(dataNS.deliveryClients)
            ? dataNS.deliveryClients
            : null;

          let mergedDelivery = prevDelivery;
          if (dataDelivery) {
            // удаляем из prev те платформы, которые пришли в data,
            // затем добавляем всё из data
            const incomingPlatforms = new Set(dataDelivery.map((d) => d.platform));
            const kept = prevDelivery.filter((c) => !incomingPlatforms.has(c.platform));
            mergedDelivery = [...kept, ...dataDelivery];
          }

          const newNS = {
            ...prevNS,
            ...dataNS,
            deliveryClients: mergedDelivery,

            rules:  dataNS.rules  ? { ...prevNS.rules,  ...dataNS.rules  } : prevNS.rules,
            stream: dataNS.stream ? { ...prevNS.stream, ...dataNS.stream } : prevNS.stream,
            logo:   dataNS.logo   ? { ...prevNS.logo,   ...dataNS.logo   } : prevNS.logo,
            csv:    dataNS.csv    ? { ...prevNS.csv,    ...dataNS.csv    } : prevNS.csv,
            game:   dataNS.game   ? { ...prevNS.game,   ...dataNS.game   } : prevNS.game,
          };

          const newCfg = {
            ...prev,
            ...data,
            notificationSystem: newNS,
            // сюда добавляй мерж других будущих инструментов
          };
          debouncedSaveTools(newCfg);
          return newCfg;
        });
        return;
      }

      // ============================================================
      // SETTINGS (settings.toml)
      // ============================================================
      if (type === "settings") {
        setSettings((prev) => {
          const newCfg = { ...prev, ...data };
          debouncedSaveSettings(newCfg);
          return newCfg;
        });
        return;
      }

      // ============================================================
      // WIDGETS (widgets.toml)
      // ============================================================
      if (type === "widgets") {
        setWidgets((prev) => {
          const prevScoreboard = prev?.scoreboard;
          const dataScoreboard = data.scoreboard;

          const newBracket = data.bracket
            ? { ...prev?.bracket, ...data.bracket }
            : prev?.bracket;

          const newScoreboard = dataScoreboard
            ? {
                ...prevScoreboard,
                ...dataScoreboard,
                P1: dataScoreboard.P1
                  ? { ...prevScoreboard?.P1, ...dataScoreboard.P1 }
                  : prevScoreboard?.P1,
                P2: dataScoreboard.P2
                  ? { ...prevScoreboard?.P2, ...dataScoreboard.P2 }
                  : prevScoreboard?.P2,
              }
            : prevScoreboard;

          const newCfg = {
            ...prev,
            ...data,
            bracket: newBracket,
            scoreboard: newScoreboard,
          };

          if (Array.isArray(newCfg.bracketSlots) && newCfg.bracketSlots.length > 0) {
            const slots = [...newCfg.bracketSlots];
            const index = Number(newCfg.activeBracketSlot) || 0;
            if (slots[index] !== undefined) slots[index] = newBracket;
            newCfg.bracketSlots = slots;
          }

          if (Array.isArray(newCfg.scoreboardSlots) && newCfg.scoreboardSlots.length > 0) {
            const slots = [...newCfg.scoreboardSlots];
            const index = Number(newCfg.activeScoreboardSlot) || 0;
            if (slots[index] !== undefined) slots[index] = newScoreboard;
            newCfg.scoreboardSlots = slots;
          }

          debouncedSaveWidgets(newCfg);
          return newCfg;
        });
        return;
      }

      // ============================================================
      // AUTHORIZATIONS (authorizations.toml)
      // ============================================================
      if (type === "authorizations") {
        setAuthorizations((prev) => {
          const newCfg = { ...prev, ...data };
          debouncedSaveAuthorizations(newCfg);
          return newCfg;
        });
        return;
      }

      console.warn("[updateConfig] unknown type:", type);
    },
    [
      isLoaded,
      setSettings,
      setWidgets,
      setAuthorizations,
      setTools,
      debouncedSaveSettings,
      debouncedSaveTourney,
      debouncedSaveWidgets,
      debouncedSaveAuthorizations,
      debouncedSaveTools,
    ]
  );

  const selectWidgetSlot = useCallback(
    (kind, index) => {
      if (kind !== "bracket" && kind !== "scoreboard") return;

      const slotIndex = Math.max(0, Math.min(4, Number(index) || 0));

      setWidgets((prev) => {
        if (!prev) return prev;

        const activeKey =
          kind === "bracket" ? "activeBracketSlot" : "activeScoreboardSlot";
        const slotsKey =
          kind === "bracket" ? "bracketSlots" : "scoreboardSlots";
        const slots = Array.isArray(prev[slotsKey]) ? [...prev[slotsKey]] : [];
        if (slots.length === 0) return prev;

        const currentActive = Number(prev[activeKey]) || 0;
        if (slots[currentActive] !== undefined) {
          slots[currentActive] = prev[kind];
        }

        const target = slots[slotIndex];
        if (!target) return prev;

        const newCfg = {
          ...prev,
          [slotsKey]: slots,
          [activeKey]: slotIndex,
          [kind]: target,
        };
        debouncedSaveWidgets(newCfg);
        return newCfg;
      });
    },
    [setWidgets, debouncedSaveWidgets],
  );

  const renameWidgetSlot = useCallback(
    (kind, index, name) => {
      if (kind !== "bracket" && kind !== "scoreboard") return;

      const slotIndex = Math.max(0, Math.min(4, Number(index) || 0));
      const value = String(name ?? "").trim();
      if (!value) return;

      setWidgets((prev) => {
        if (!prev) return prev;

        const namesKey =
          kind === "bracket" ? "bracketSlotNames" : "scoreboardSlotNames";
        const names = Array.isArray(prev[namesKey]) ? [...prev[namesKey]] : [];
        while (names.length < 5) names.push(`Slot ${names.length + 1}`);
        names[slotIndex] = value;

        const newCfg = { ...prev, [namesKey]: names };
        debouncedSaveWidgets(newCfg);
        return newCfg;
      });
    },
    [setWidgets, debouncedSaveWidgets],
  );

  const resetWidgetSlot = useCallback(
    (kind, index, defaultName) => {
      if (kind !== "bracket" && kind !== "scoreboard") return;

      const slotIndex = Math.max(0, Math.min(4, Number(index) || 0));
      const defaults =
        kind === "bracket"
          ? createDefaultBracketSlot()
          : createDefaultScoreboardSlot();

      setWidgets((prev) => {
        if (!prev) return prev;

        const slotsKey =
          kind === "bracket" ? "bracketSlots" : "scoreboardSlots";
        const activeKey =
          kind === "bracket" ? "activeBracketSlot" : "activeScoreboardSlot";
        const namesKey =
          kind === "bracket" ? "bracketSlotNames" : "scoreboardSlotNames";

        const slots = Array.isArray(prev[slotsKey]) ? [...prev[slotsKey]] : [];
        while (slots.length < 5) slots.push(defaults);
        slots[slotIndex] = defaults;

        const names = Array.isArray(prev[namesKey]) ? [...prev[namesKey]] : [];
        while (names.length < 5) names.push("");
        names[slotIndex] = defaultName?.trim() || `Slot ${slotIndex + 1}`;

        const newCfg = {
          ...prev,
          [slotsKey]: slots,
          [namesKey]: names,
        };
        if ((Number(prev[activeKey]) || 0) === slotIndex) {
          newCfg[kind] = defaults;
        }

        debouncedSaveWidgets(newCfg);
        return newCfg;
      });
    },
    [setWidgets, debouncedSaveWidgets],
  );

  return { updateConfig, selectWidgetSlot, renameWidgetSlot, resetWidgetSlot };
}