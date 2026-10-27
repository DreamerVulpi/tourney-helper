import { useEffect, useRef } from "react";
import { hydrateFromBackend } from "../Profiles/hydrateFromBackend";

export function useAppInit({ locale }) {
  const isConfigLoadedRef = useRef(false);

  useEffect(() => {
    if (!locale) return;
    if (isConfigLoadedRef.current) return;
    isConfigLoadedRef.current = true;

    hydrateFromBackend({ markLoaded: true }).catch((err) =>
      console.error("[useAppInit] failed:", err)
    );
  }, [locale]);
}