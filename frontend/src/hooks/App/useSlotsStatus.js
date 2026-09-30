import { useCallback } from "react";
import { SetSlotStatus } from "../../../wailsjs/go/application/App.js";
import { AUTH_STATUS } from "../../utils/authStatus";

export const useSlotStatus = ({
  authorizations,
  updateConfig,
  updatePlatformSlot,
}) => {
  const markSlotStatus = useCallback(
    async (platformId, slotIndex, status, reason) => {
      if (updateConfig && updatePlatformSlot) {
        const platform = authorizations?.[platformId];

        const patch = {
          status,
          statusReason: reason || "",
        };

        // lastAuthAt — только при успешной авторизации
        if (status === AUTH_STATUS.AUTHORIZED) {
          patch.lastAuthAt = new Date().toISOString();
        }

        updateConfig("authorizations", {
          [platformId]: updatePlatformSlot(platform, slotIndex, patch),
        });
      }

      try {
        await SetSlotStatus(platformId, slotIndex, status, reason || "");
      } catch (err) {
        console.error("[markSlotStatus] SetSlotStatus failed:", err);
      }
    },
    [authorizations, updateConfig, updatePlatformSlot]
  );

  return { markSlotStatus };
};