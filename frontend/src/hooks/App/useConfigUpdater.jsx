export function useConfigUpdater({
    isLoaded,
    setSystemCfg,
    setTourneyCfg,
    setSettings,
    debouncedSaveSystem,
    debouncedSaveSettings,
    debouncedSaveTourney,
}) {
    const updateConfig = (type, data) => {
    if (!isLoaded) return;

    if (type === "system") {
      setSystemCfg((prev) => {
        const newCfg = {
          ...prev,
          ...data,
          discord: data.discord
            ? { ...prev.discord, ...data.discord }
            : prev.discord,
          debug: data.debug ? { ...prev.debug, ...data.debug } : prev.debug,
          database: data.database
            ? { ...prev.database, ...data.database }
            : prev.database,
        };
        debouncedSaveSystem(newCfg);
        return newCfg;
      });
    } else if (type === "settings") {
      setSettings((prev) => {
        const newCfg = {
          ...prev,
          ...data,
        };
        debouncedSaveSettings(newCfg);
        return newCfg;
      });
    } else {
      setTourneyCfg((prev) => {
        const newCfg = {
          ...prev,
          ...data,
          stream: data.stream
            ? { ...prev.stream, ...data.stream }
            : prev.stream,
          startgg: data.startgg
            ? { ...prev.startgg, ...data.startgg }
            : prev.startgg,
          challonge: data.challonge
            ? { ...prev.challonge, ...data.challonge }
            : prev.challonge,
          rules: data.rules ? { ...prev.rules, ...data.rules } : prev.rules,
        };
        debouncedSaveTourney(newCfg);
        return newCfg;
      });
    }
  };
  return {
    updateConfig,
  };
}