import { useEffect } from "react";
import { EventsOn, EventsOff } from "../../../wailsjs/runtime/runtime";
import { useAppStore } from "../../store/useAppStore";
import { AUTH_STATUS } from "../../utils/authStatus";
import { updatePlatformSlot } from "../../utils/authorizations";

// Пишет статус слота ТОЛЬКО в локальный стор.
// На диск ничего не сохраняем — бэкенд уже сделал SetSlotStatus → SaveAuthorizations.
const applySlotStatus = (platform, slotIndex, status, reason = "") => {
  const { setAuthorizations } = useAppStore.getState();

  setAuthorizations((prev) => {
    const base = prev?.[platform] || { activeSlot: -1, slots: [] };
    return {
      ...(prev || {}),
      [platform]: updatePlatformSlot(base, slotIndex, {
        status,
        statusReason: reason,
      }),
    };
  });
};

export const useAuthEvents = () => {
  useEffect(() => {
    const handlePending = (platform, slotIndex) => {
      console.log("[event] auth:pending", platform, slotIndex);
      applySlotStatus(platform, slotIndex, AUTH_STATUS.PENDING, "");
    };

    const handleSuccess = (platform, slotIndex) => {
      console.log("[event] auth:success", platform, slotIndex);
      applySlotStatus(platform, slotIndex, AUTH_STATUS.AUTHORIZED, "");

      useAppStore
        .getState()
        .setAuthFlags((prev) => ({ ...prev, [platform]: true }));
    };

    const handleError = (platform, slotIndex, reason) => {
      console.log("[event] auth:error", platform, slotIndex, reason);
      applySlotStatus(
        platform,
        slotIndex,
        AUTH_STATUS.UNAUTHORIZED,
        reason || ""
      );

      useAppStore
        .getState()
        .setAuthFlags((prev) => ({ ...prev, [platform]: false }));
    };

    EventsOn("auth:pending", handlePending);
    EventsOn("auth:success", handleSuccess);
    EventsOn("auth:error", handleError);

    return () => {
      EventsOff("auth:pending");
      EventsOff("auth:success");
      EventsOff("auth:error");
    };
  }, []);
};