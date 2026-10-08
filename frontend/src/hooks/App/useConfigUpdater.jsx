import { useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";

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
          const newCfg = {
            ...prev,
            ...data,
            bracket: data.bracket
              ? { ...prev?.bracket, ...data.bracket }
              : prev?.bracket,
          };
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

  return { updateConfig };
}