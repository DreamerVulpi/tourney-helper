import {
  StartSendNotifications,
  StopSendNotifications,
} from "../../../wailsjs/go/application/App.js";

export function useStartSendingToggle(
  isStartedSending,
  setIsStartedSending,

  isProcessing,
  setIsProcessing,
  setReport,
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
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
      return;
    } else {
      try {
        await StartSendNotifications(
          activeMessenger,
          activePlatform,
          systemCfg,
          tourneyCfg,
          lang,
        );
        setReport({isOpen: true})
        setIsStartedSending(true);
      } catch (err) {
        console.error(err);
        setIsStartedSending(false);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  return toggleSending;
}
