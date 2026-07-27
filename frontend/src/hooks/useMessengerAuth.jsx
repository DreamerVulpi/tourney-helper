import { useCallback } from "react";
import { AuthorizeMessenger } from "../services/auth/messegner/index.js";


export const useMessengerAuth = ({
  systemCfg,
  locale,
  activeMessenger,
  setActiveMessenger,
  setAuthStatus,
  setValidationAlert,
}) => {
  const handleMessengerClick = useCallback(
    async (messengerName) => {
      const nextMessenger =
        activeMessenger === messengerName
          ? ""
          : messengerName;

      setActiveMessenger(nextMessenger);

      if (!nextMessenger) return;

      const {
        token,
        clientID,
        secretClient,
        guildID,
      } = systemCfg[nextMessenger] ?? {};

      if (!token || !clientID || !secretClient || !guildID) {
        setActiveMessenger("");

        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsgMessengerPlatform,
        });

        return;
      }

      try {
        await AuthorizeMessenger(nextMessenger, {
          token,
          clientID,
          secretClient,
        });

        setAuthStatus((prev) => ({
          ...prev,
          [nextMessenger]: true,
        }));
      } catch (err) {
        console.error(err);

        setAuthStatus((prev) => ({
          ...prev,
          [nextMessenger]: false,
        }));
      }
    },
    [
      activeMessenger,
      systemCfg,
      locale,
      setActiveMessenger,
      setAuthStatus,
      setValidationAlert,
    ]
  );

  return {
    handleMessengerClick,
  };
};