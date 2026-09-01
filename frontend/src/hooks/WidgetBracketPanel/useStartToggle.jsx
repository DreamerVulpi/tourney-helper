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
  { activePlatform, tourneyCfg},
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
    } else {
      try {
        setStatusWidgetBracket(SERVICE_STATUS.STARTING);
        await LaunchWidgetBracket(
          activePlatform,
          tourneyCfg,
        );
        setIsWidgetBracketRunning(true);
        setStatusWidgetBracket(SERVICE_STATUS.RUNNING);
      } catch (err) {
        console.error(err);
        setIsWidgetBracketRunning(false);
        setStatusWidgetBracket(SERVICE_STATUS.ERROR);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  return toggleStart;
}
