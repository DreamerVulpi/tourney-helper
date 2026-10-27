import { useCallback } from "react";
import { AuthorizeMessenger } from "../services/auth/messegner/index.js";
import { AUTH_STATUS } from "../utils/authStatus";
import { useSlotStatus } from "./App/useSlotsStatus.js";

export const useMessengerAuth = ({
  locale,
  activeDeliveryMethod,
  setActiveDeliveryMethod,
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

  const handleMessengerClick = useCallback(
    (messengerName) => {
      const next =
        activeDeliveryMethod === messengerName ? "" : messengerName;
      setActiveDeliveryMethod(next);
    },
    [activeDeliveryMethod, setActiveDeliveryMethod]
  );

  const authorizeMessengerSlot = useCallback(
    async (messengerName, slotIndex) => {
      const platform = authorizations?.[messengerName];
      const slot = platform?.slots?.[slotIndex];

      if (!slot) {
        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsgMessengerPlatform,
        });
        return;
      }

      const { token, clientID, secretClient, guildID } = slot;

      if (!token || !clientID || !secretClient || !guildID) {
        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsgMessengerPlatform,
        });
        return;
      }

      await markSlotStatus(messengerName, slotIndex, AUTH_STATUS.PENDING, "");

      try {
        await AuthorizeMessenger(messengerName, {
          token,
          clientID,
          secretClient,
          slotIndex,
        });

        await markSlotStatus(
          messengerName,
          slotIndex,
          AUTH_STATUS.AUTHORIZED,
          ""
        );

        setAuthFlags((prev) => ({ ...prev, [messengerName]: true }));
      } catch (err) {
        console.error(err);

        const reason = err?.message || String(err);
        await markSlotStatus(
          messengerName,
          slotIndex,
          AUTH_STATUS.ERROR,
          reason
        );

        setAuthFlags((prev) => ({ ...prev, [messengerName]: false }));
      }
    },
    [authorizations, locale, markSlotStatus, setAuthFlags, setValidationAlert]
  );

  return { handleMessengerClick, authorizeMessengerSlot };
};