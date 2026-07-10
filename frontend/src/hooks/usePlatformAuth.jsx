import { useState, useCallback } from "react";

export function usePlatformAuth({
  platforms,
  locale,
  activePlatform,
  setActivePlatform,
  authStatus,
  setAuthStatus,
  setValidationAlert,
}) {
    
  const handlePlatformClick = useCallback(
    async (platformName) => {
      const platform = platforms[platformName];

      if (!platform) {
        return;
      }

      const nextPlatform =
        activePlatform === platformName ? "" : platformName;

      setActivePlatform(nextPlatform);

      if (!nextPlatform) {
        return;
      }

      const config = platform.config;

      const missingFields = platform.requiredFields.some(
        (field) => !config?.[field]
      );

      if (missingFields) {
        setActivePlatform("");

        setValidationAlert({
          isOpen: true,
          message: locale.Platform.RequireMsg,
        });

        return;
      }

      try {
        await platform.authorize(config);

        setAuthStatus((prev) => ({
          ...prev,
          [platformName]: true,
        }));
      } catch (error) {
        console.error(error);

        setAuthStatus((prev) => ({
          ...prev,
          [platformName]: false,
        }));
      }
    },
    [activePlatform, locale, platforms, setValidationAlert]
  );

  setAuthStatus((prev) => ({
    ...prev,
    [platformName]: true,
    }));

  return {
    activePlatform,
    handlePlatformClick,
  };
}