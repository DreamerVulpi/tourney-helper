import {
  LaunchWidgetScoreboard,
  StopWidgetScoreboard,
} from "../../../wailsjs/go/application/App.js";
import { SERVICE_STATUS } from "../../utils/listStatus.js";

export function useStartToggle(
  isWidgetScoreboardRunning,
  setIsWidgetScoreboardRunning,
  isProcessing,
  setIsProcessing,
  setStatusWidgetScoreboard,
) {
  const toggleStart = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    if (isWidgetScoreboardRunning) {
      try {
        await StopWidgetScoreboard();
        setIsWidgetScoreboardRunning(false);
        setStatusWidgetScoreboard(SERVICE_STATUS.OFF);
      } catch (err) {
        console.error(err);
        setStatusWidgetScoreboard(SERVICE_STATUS.ERROR);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      setStatusWidgetScoreboard(SERVICE_STATUS.STARTING);

      await LaunchWidgetScoreboard();

      setIsWidgetScoreboardRunning(true);
      setStatusWidgetScoreboard(SERVICE_STATUS.RUNNING);
    } catch (err) {
      console.error(err);
      setIsWidgetScoreboardRunning(false);
      setStatusWidgetScoreboard(SERVICE_STATUS.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  return toggleStart;
}
