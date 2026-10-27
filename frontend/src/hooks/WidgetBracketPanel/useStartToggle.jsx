import {
  LaunchWidgetBracket,
  StopWidgetBracket,
} from "../../../wailsjs/go/application/App.js";
import { SERVICE_STATUS } from "../../utils/listStatus.js";

export function useStartToggle(
  isWidgetBracketRunning,
  setIsWidgetBracketRunning,
  isProcessing,
  setIsProcessing,
  setStatusWidgetBracket,
  { ref, authorizations, widgets },
) {
  const toggleStart = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    if (isWidgetBracketRunning) {
      try {
        await StopWidgetBracket();
        setIsWidgetBracketRunning(false);
        setStatusWidgetBracket(SERVICE_STATUS.OFF);
      } catch (err) {
        console.error(err);
        setStatusWidgetBracket(SERVICE_STATUS.ERROR);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!ref) {
      console.error("[useStartToggle] no client ref selected");
      setIsProcessing(false);
      setStatusWidgetBracket(SERVICE_STATUS.ERROR);
      return;
    }

    const [platform, slotStr] = ref.split(":");
    const slotIndex = Number(slotStr);

    if (!platform || Number.isNaN(slotIndex)) {
      console.error("[useStartToggle] invalid ref:", ref);
      setIsProcessing(false);
      setStatusWidgetBracket(SERVICE_STATUS.ERROR);
      return;
    }

    try {
      setStatusWidgetBracket(SERVICE_STATUS.STARTING);

      await LaunchWidgetBracket(platform, slotIndex, authorizations, widgets);

      setIsWidgetBracketRunning(true);
      setStatusWidgetBracket(SERVICE_STATUS.RUNNING);
    } catch (err) {
      console.error(err);
      setIsWidgetBracketRunning(false);
      setStatusWidgetBracket(SERVICE_STATUS.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  return toggleStart;
}