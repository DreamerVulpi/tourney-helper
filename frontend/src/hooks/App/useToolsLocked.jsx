import { useAppStore } from "../../store/useAppStore";
import { SERVICE_STATUS } from "../../utils/listStatus";

export function useToolsLocked() {
  const statusNotificationSystem = useAppStore((s) => s.statusNotificationSystem);
  const statusWidgetBracket = useAppStore((s) => s.statusWidgetBracket);

  const isBusy = (s) =>
    s === SERVICE_STATUS.STARTING || s === SERVICE_STATUS.RUNNING;

  return isBusy(statusNotificationSystem) || isBusy(statusWidgetBracket);
}