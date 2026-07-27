import { useCallback } from "react";
import { authorizeTournamentPlatform } from "../services/auth/tournamentPlatform/index.js";

export const useTournamentPlatform = ({
  tourneyCfg,
  locale,
  activePlatform,
  setActivePlatform,
  setAuthStatus,
  setValidationAlert,
}) => {
  const handleTournamentPlatformClick = useCallback(
    async (platformName) => {
      const nextPlatform =
        activePlatform === platformName
          ? ""
          : platformName;

      setActivePlatform(nextPlatform);

      if (!nextPlatform) return;

      const {
        clientID,
        secretClient,
      } = tourneyCfg[nextPlatform] ?? {};

      if (!clientID || !secretClient) {
        setActivePlatform("");

        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsgTournamentPlatform,
        });

        return;
      }

      try {
        await authorizeTournamentPlatform(nextPlatform, {
          clientID,
          secretClient,
        });

        setAuthStatus((prev) => ({
          ...prev,
          [nextPlatform]: true,
        }));
      } catch (err) {
        console.error(err);

        setAuthStatus((prev) => ({
          ...prev,
          [nextPlatform]: false,
        }));
      }
    },
    [
      activePlatform,
      tourneyCfg,
      locale,
      setActivePlatform,
      setAuthStatus,
      setValidationAlert,
    ]
  );

  return {
    handleTournamentPlatformClick,
  };
};