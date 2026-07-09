import { GetUiLocale } from "../../../wailsjs/go/application/App.js";
import { useEffect, useState } from "react";

export function useLocale(initialLang = "EN") {
    const [lang, setLang] = useState(initialLang)
    const [locale, setLocale] = useState(null);

    useEffect(() => {
    const loadLocalization = async () => {
      try {
        const data = await GetUiLocale(lang);
        setLocale(data);
        console.log(`${lang} - ${data.LogPanel.LocaleLoaded}`, data);
      } catch (err) {
        console.error(`Failed to load locale:`, err);
      }
    };
    loadLocalization();
  }, [lang]);
  return {
    lang,
    locale,
    setLang,
  }
}

