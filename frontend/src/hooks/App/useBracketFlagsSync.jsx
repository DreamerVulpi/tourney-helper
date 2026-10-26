import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";


export function useBracketFlagsSync() {
  const bracket = useAppStore((s) => s.widgets?.bracket);
  const isLoaded = useAppStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isLoaded) return;
    if (!bracket) return;

    const flags = {
      transparent: !!bracket.clearBackground,
      hideRounds:  !!bracket.hideStages,
      bracketMode: bracket.bracketMode || "all",
      scale:       typeof bracket.scale === "number" && bracket.scale > 0 ? bracket.scale : 1.0,
      autoRefresh: !!bracket.autoRefresh,
    };

    try {
      localStorage.setItem("bracket:flags", JSON.stringify(flags));
    } catch (e) {
      console.warn("[bracket-sync] localStorage failed:", e);
    }

    let channel = null;
    try {
      channel = new BroadcastChannel("bracket:flags");
      channel.postMessage({ type: "bracket:flags-changed", flags });
      channel.close();
    } catch (e) {
      console.warn("[bracket-sync] BroadcastChannel failed:", e);
    }


    fetch("http://localhost:8080/widget/bracket/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flags),
    }).catch((err) => {
      console.warn("[bracket-sync] POST flags failed:", err);
    });
  }, [bracket, isLoaded]);
}