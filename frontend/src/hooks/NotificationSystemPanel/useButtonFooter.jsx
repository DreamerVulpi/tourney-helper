import React from "react";
import {
  Play,
  AlertCircle,
  Bug,
  Square,
} from "lucide-react";

import { ActionButton } from "../../components/ui/ActionButton.jsx";

export const NotificationButton = React.memo(
  function NotificationButtonFooter({
    isStartedSending,
    debugMode,
    theme,
    locale,
    activeMessenger,
    isReadyToStart,
    isProcessing,
    handleStartedSendingToggle,
    getButtonStyle,
  }) {
    return (
      <>
        {!isStartedSending && debugMode && (
          <div
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-amber-500 slide-in-from-bottom-2 ${
              theme === "dark"
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-white border-amber-200 shadow-lg"
            }`}
          >
            <AlertCircle size={14} className="shrink-0" />

            <span className="text-[9px] font-bold uppercase italic tracking-tight leading-tight">
              {locale.Mailing.AttentionDebugModeMsg}{" "}
              {activeMessenger || ""}
            </span>
          </div>
        )}

        <ActionButton
          icon={
            isStartedSending
              ? Square
              : debugMode
                ? Bug
                : Play
          }
          loading={isProcessing}
          disabled={!isReadyToStart}
          expandOnHover={isStartedSending && !isProcessing}
          onClick={handleStartedSendingToggle}
          className={getButtonStyle}
          iconClassName="fill-white"
        >
          {isStartedSending
            ? locale.Mailing.Stop
            : debugMode
              ? locale.Mailing.Debug
              : locale.Mailing.Start}
        </ActionButton>
      </>
    );
  }
);