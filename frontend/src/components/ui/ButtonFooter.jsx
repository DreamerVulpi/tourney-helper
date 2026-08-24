import React from "react";
import {
  Play,
  AlertCircle,
  Bug,
  Square,
} from "lucide-react";

export const ButtonFooter = React.memo(function RightPanelFooter({
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
    <div className="flex flex-col items-end gap-3">
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
            {activeMessenger ? activeMessenger : ""}
          </span>
        </div>
      )}

      {/* Start/stop sending messages */}
      <button
        type="button"
        disabled={!isReadyToStart || isProcessing}
        onClick={handleStartedSendingToggle}
        className={`
          relative
          flex
          items-center
          overflow-hidden
          h-14
          ${
            isStartedSending && !isProcessing
              ? "w-14 justify-center px-0 gap-0 hover:w-52"
              : "px-10 gap-4"
          }
          rounded-2xl
          font-black text-lg uppercase tracking-wider italic
           duration-300
          overflow-hidden
          shadow-xl
          group
          text-white
          ${getButtonStyle}
          ${
            !isReadyToStart || isProcessing
              ? "opacity-40 cursor-not-allowed grayscale"
              : "hover:scale-[1.02] active:scale-95"
          }
        `}
      >
        {isProcessing ? (
          <>
            {/* Loading process */}
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isStartedSending ? locale.Mailing.Stop : locale.Mailing.Start}
          </>
        ) : isStartedSending ? (
          <>
            <div
              className="
                flex
                items-center
                justify-center
                w-5
                shrink-0
              "
            >
              <Square fill="white" size={20} className="shrink-0" />
            </div>

            <span
              className="
                flex
                items-center
                max-w-0
                overflow-hidden
                whitespace-nowrap
                opacity-0
                
                duration-300
                group-hover:max-w-[200px]
                group-hover:opacity-100
                group-hover:ml-3
              "
            >
              {locale.Mailing.Stop}
            </span>
          </>
        ) : (
          <>
            {debugMode ? (
              <Bug fill="white" size={20} />
            ) : (
              <Play fill="white" size={20} />
            )}
            {debugMode ? locale.Mailing.Debug : locale.Mailing.Start}
          </>
        )}
      </button>
    </div>
  );
});

