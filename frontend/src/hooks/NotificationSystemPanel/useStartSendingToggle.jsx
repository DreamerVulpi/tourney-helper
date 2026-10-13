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
  {
    tourneyClient,
    deliveryClient,
    authorizations,    
    notificationSystem,
    settings,          
  },
) {
  
  const toggleSending = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (isStartedSending) {
      try {
        setReport({ isOpen: false });
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
    }

    try {
      setStatusNotificationSystem(SERVICE_STATUS.STARTING);
      console.log("[useStartSendingToggle] notificationSystem:", notificationSystem);
      console.log("[useStartSendingToggle] settings:", settings);
      await StartSendNotifications(
        deliveryClient.platform,    // messenger: "discord" | "telegram"
        deliveryClient.slotIndex,   // messengerSlot
        tourneyClient.platform,     // tournamentPlatform: "startgg" | "challonge"
        tourneyClient.slotIndex,    // tourneySlot
        authorizations,             // cfgAuthorizations
        notificationSystem,         // cfgTournament
        settings,                   // SettingsApplicationCfg
      );

      setReport({ isOpen: true });
      setIsStartedSending(true);
      setStatusNotificationSystem(SERVICE_STATUS.RUNNING);
    } catch (err) {
      console.error(err);
      setIsStartedSending(false);
      setStatusNotificationSystem(SERVICE_STATUS.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  return toggleSending;
}