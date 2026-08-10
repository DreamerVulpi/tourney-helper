import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Modal } from "./Modal.jsx";

export function ProgressModal({
  isOpen,
  onClose,
  title,
  message,
  status,
  progress = 0,
  themeClasses,
}) {
  if (!isOpen) return null;

  const isLoading = status === "idle" || status === "loading";
  const isError = status === "error";
  const isWarning = status === "warning";
  const isSuccess = status === "success";

  let icon = RefreshCw;
  let iconColor = "blue";

  if (isError) {
    icon = AlertCircle;
    iconColor = "red";
  } else if (isWarning) {
    icon = AlertCircle;
    iconColor = "amber";
  } else if (isSuccess) {
    icon = CheckCircle2;
    iconColor = "green";
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title={title}
      icon={icon}
      iconColor={iconColor}
      themeClasses={themeClasses}
      showCloseButton={!isLoading}
      width="max-w-md"
    >
      <div className="p-6 space-y-5">

        {/* Status */}
        <div className="flex flex-col items-center text-center gap-3">

          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10">
            {isLoading && (
              <RefreshCw
                size={30}
                className="text-blue-500 animate-spin"
              />
            )}

            {isError && (
              <AlertCircle
                size={32}
                className="text-red-500"
              />
            )}

            {isWarning && (
              <AlertCircle
                size={32}
                className="text-amber-500"
              />
            )}

            {isSuccess && (
              <CheckCircle2
                size={32}
                className="text-green-500"
              />
            )}
          </div>

          <p
            className={`
              text-sm
              font-bold
              break-words
              ${
                isError
                  ? "text-red-500"
                  : isWarning
                    ? "text-amber-500"
                    : isSuccess
                      ? "text-green-500"
                      : ""
              }
            `}
          >
            {message}
          </p>
        </div>

        {/* Progress */}
        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono font-bold opacity-60">
            <span>{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden bg-white/5">
            <div
              className={`
                h-full
                rounded-full
                transition-all
                duration-500
                ${
                  isError
                    ? "bg-red-500"
                    : isWarning
                      ? "bg-amber-500"
                      : isSuccess
                        ? "bg-green-500"
                        : "bg-blue-600"
                }
              `}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>
    </Modal>
  );
}

export default ProgressModal;