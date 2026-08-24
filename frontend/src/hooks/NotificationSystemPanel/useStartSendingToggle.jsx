import {
  StartSendNotifications,
  StopSendNotifications,
} from "../../../wailsjs/go/application/App.js";
import { SERVICE_STATUS } from "../../utils/listStatus.js";

export function useStartSendingToggle(
  isStartedSending,
  setIsStartedSending,

  isProcessing,
  setIsProcessing,
  setReport,
  setStatusNotificationSystem,
  { activeMessenger, activePlatform, systemCfg, tourneyCfg, lang },
) {
  const toggleSending = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    if (isStartedSending) {
      try {
        setReport({isOpen: false})
        await StopSendNotifications();
        setIsStartedSending(false);
        setStatusNotificationSystem(SERVICE_STATUS.OFF);
      } catch (err) {
        console.error(err);
        setStatusNotificationSystem(SERVICE_STATUS.ERROR);
      } finally {
        setIsProcessing(false);
      }
      return;
    } else {
      try {
        setStatusNotificationSystem(SERVICE_STATUS.STARTING);
        await StartSendNotifications(
          activeMessenger,
          activePlatform,
          systemCfg,
          tourneyCfg,
          lang,
        );
        setReport({isOpen: true})
        setIsStartedSending(true);
        setStatusNotificationSystem(SERVICE_STATUS.RUNNING);
      } catch (err) {
        console.error(err);
        setIsStartedSending(false);
        setStatusNotificationSystem(SERVICE_STATUS.ERROR);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  return toggleSending;
}
