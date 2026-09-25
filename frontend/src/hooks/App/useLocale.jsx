import { GetUiLocale } from "../../../wailsjs/go/application/App.js";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";

export function useLocale() {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);

  const [locale, setLocale] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLocalization = async () => {
      try {
        const data = await GetUiLocale(lang);
        if (cancelled) return;
        setLocale(data);
        console.log(`${lang} - ${data.LogPanel.LocaleLoaded}`, data);
      } catch (err) {
        if (cancelled) return;
        console.error(`Failed to load locale:`, err);
      }
    };

    loadLocalization();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return { locale };
}