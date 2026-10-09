import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";

/**
 * Синхронизирует widgets.bracket с:
 *  - localStorage (для новых вкладок)
 *  - BroadcastChannel (для открытых вкладок в реальном времени)
 *  - backend POST /widget/bracket/flags (для начального рендера виджета)
 */
export function useBracketFlagsSync() {
  const bracket = useAppStore((s) => s.widgets?.bracket);
  const isLoaded = useAppStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isLoaded) return;
    if (!bracket) return;

    // Преобразуем поля конфига в формат "флагов", который ждёт виджет
    const flags = {
      transparent: !!bracket.clearBackground,
      hideRounds:  !!bracket.hideStages,
      bracketMode: bracket.bracketMode || "all",
      scale:       typeof bracket.scale === "number" && bracket.scale > 0 ? bracket.scale : 1.0,
      autoRefresh: !!bracket.autoRefresh,
    };

    // 1. localStorage — чтобы новые вкладки сразу видели актуальные флаги
    try {
      localStorage.setItem("bracket:flags", JSON.stringify(flags));
    } catch (e) {
      console.warn("[bracket-sync] localStorage failed:", e);
    }

    // 2. BroadcastChannel — для уже открытых вкладок
    let channel = null;
    try {
      channel = new BroadcastChannel("bracket:flags");
      channel.postMessage({ type: "bracket:flags-changed", flags });
      channel.close();
    } catch (e) {
      console.warn("[bracket-sync] BroadcastChannel failed:", e);
    }

    // 3. Backend — чтобы сервер отдавал правильные флаги при загрузке виджета
    fetch("http://localhost:8080/widget/bracket/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flags),
    }).catch((err) => {
      // Сервер виджета может быть ещё не запущен — это не критично
      console.warn("[bracket-sync] POST flags failed:", err);
    });
  }, [bracket, isLoaded]);
}