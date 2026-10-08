import { useCallback } from "react";
import { authorizeTournamentPlatform } from "../services/auth/tournamentPlatform/index.js";
import { AUTH_STATUS } from "../utils/authStatus";
import { useSlotStatus } from "./App/useSlotsStatus.js";

export const useTournamentPlatform = ({
  locale,
  activeTournamentPlatform,
  setActiveTournamentPlatform,
  setAuthFlags,
  setValidationAlert,
  authorizations,
  updateConfig,
  updatePlatformSlot,
}) => {
  const { markSlotStatus } = useSlotStatus({
    authorizations,
    updateConfig,
    updatePlatformSlot,
  });

  const handleTournamentPlatformClick = useCallback(
    (platformName) => {
      const next =
        activeTournamentPlatform === platformName ? "" : platformName;
      setActiveTournamentPlatform(next);
    },
    [activeTournamentPlatform, setActiveTournamentPlatform]
  );

  const authorizeTournamentSlot = useCallback(
    async (platformName, slotIndex) => {
      const platform = authorizations?.[platformName];
      const slot = platform?.slots?.[slotIndex];

      if (!slot) {
        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsgTournamentPlatform,
        });
        return;
      }

      const { clientID, secretClient } = slot;

      if (!clientID || !secretClient) {
        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsgTournamentPlatform,
        });
        return;
      }

      await markSlotStatus(platformName, slotIndex, AUTH_STATUS.PENDING, "");

      try {
        await authorizeTournamentPlatform(platformName, {
          clientID,
          secretClient,
          slotIndex,
        });

        await markSlotStatus(
          platformName,
          slotIndex,
          AUTH_STATUS.AUTHORIZED,
          ""
        );

        setAuthFlags((prev) => ({ ...prev, [platformName]: true }));
      } catch (err) {
        console.error(err);

        const reason = err?.message || String(err);
        await markSlotStatus(
          platformName,
          slotIndex,
          AUTH_STATUS.ERROR,
          reason
        );

        setAuthFlags((prev) => ({ ...prev, [platformName]: false }));
      }
    },
    [authorizations, locale, markSlotStatus, setAuthFlags, setValidationAlert]
  );

  return { handleTournamentPlatformClick, authorizeTournamentSlot };
};