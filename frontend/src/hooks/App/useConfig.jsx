import { useState } from "react";

const initialSystemConfig = {
    discord: {
      token: "",
      guildID: "",
      clientID: "",
      secretClient: "",
      debugChannelID: "",
      roles: { ru: "", en: "" },
    },
    telegram: {
      token: "",
      guildID: "",
      clientID: "",
      secretClient: "",
      debugChannelID: "",
      roles: { ru: "", en: "" },
    },
    debug: { mode: false },
    database: { dsn: "" },
};

const initialTourneyConfig = {
   startgg: { clientID: "", secretClient: "", name: "" },
    challonge: { clientID: "", secretClient: "", name: "" },
    urlToTournament: "",
    rules: {
      standardFormat: 2,
      finalsFormat: 3,
      rounds: 3,
      duration: 60,
      crossplatform: true,
      stage: "Any",
    },
    stream: {
      area: "EU",
      language: "EN",
      connection: "Wired",
      passcode: "0000",
    },
    game: { name: "Tekken8" },
    logo: { img: "" },
    csv: { nameFile: "" },
}

export function useSystemConfig() {
    const [systemCfg, setSystemCfg] = useState(initialSystemConfig);
    return {
        systemCfg, setSystemCfg,
    };
}

export function useTourneyConfig() {
  const [tourneyCfg, setTourneyCfg] = useState(initialTourneyConfig);
  return {
    tourneyCfg, setTourneyCfg,
  }
}