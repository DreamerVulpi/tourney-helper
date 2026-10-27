import { useMemo } from "react";
import { useAppStore } from "../../store/useAppStore";

export const useClientFromRef = (ref) => {
  const authorizations = useAppStore((s) => s.authorizations);

  return useMemo(() => {
    if (!ref) return null;
    const [platform, slotStr] = ref.split(":");
    const slotIndex = Number(slotStr);
    if (!platform || Number.isNaN(slotIndex)) return null;
    const client = authorizations?.[platform]?.slots?.[slotIndex];
    if (!client || client.status !== "authorized") return null;
    return { ...client, platform, slotIndex, ref };
  }, [ref, authorizations]);
};