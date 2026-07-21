import React from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { ModalContainer } from "./modals/ModalContainter";

const ImportProgressModal = ({ isOpen, onClose, theme = "dark", status, errorData, resultData, locale }) => {
  if (!isOpen) return null;

  const isDark = theme === "dark";

 const isError = status === "error" || !!errorData;
  const isWarning = status === "warning";
  const isCompleted = status === "success";

  const SuccessImportMsgParts = locale.LoadingImportFileModalWindows.SuccessImportDBMsg.split("%v");


  let statusText = locale.LoadingImportFileModalWindows.InitImportFileMsg;
  if (status === "loading") statusText = locale.LoadingImportFileModalWindows.WriteParticipantsInDBMsg;
  if (isCompleted) {
    const successCount = resultData?.r1 ?? resultData?.s ?? 0;
    const totalCount = resultData?.r2 ?? resultData?.t ?? 0;
    statusText = `${SuccessImportMsgParts[0]} ${successCount} ${SuccessImportMsgParts[1]} ${totalCount}`;
  }

  if (isWarning) {
    statusText = `${locale.LoadingImportFileModalWindows.WarningStatusText}`;
  }
  if (isError) {
    statusText = `${locale.LoadingImportFileModalWindows.ErrorImportFileMsg} ${errorData}`;
  }

 
  let progress = 0;
  if (status === "loading") progress = 50;
  if (isCompleted || isWarning || isError) progress = 100;

  return (
    <ModalContainer
      isOpen={isOpen}
      closeOnOverlay={false}
      width="max-w-md"
    >
      <div className={`rounded-2xl p-6 shadow-2xl border transition-all ${
        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        
        <div className="flex flex-col items-center text-center space-y-4">
          
          {/* Icon of state */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10">
            {isError ? (
              <AlertCircle size={32} className="text-red-500 animate-pulse" />
            ) : isWarning ? (
              <AlertCircle size={32} className="text-orange-500" />
            ) : isCompleted ? (
              <CheckCircle2 size={32} className="text-green-500" />
            ) : (
              <RefreshCw size={28} className="text-blue-500 animate-spin duration-1000" />
            )}
          </div>

          {/* Text of state */}
          <div className="space-y-1 w-full">
            <h3 className="text-[10px] font-black uppercase tracking-wider italic text-slate-500">
              {
                isError
                  ? locale.LoadingImportFileModalWindows.CriticalFailureStatus
                  : isWarning
                    ? locale.LoadingImportFileModalWindows.Warning
                    : locale.LoadingImportFileModalWindows.StatusInProcess
              }
            </h3>
            <p
              className={`text-xs font-bold min-h-[20px] px-2 break-words ${
                isError
                  ? "text-red-400"
                  : isWarning
                    ? "text-orange-400"
                    : ""
              }`}
            >
              {statusText}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-1.5 pt-2">
            <div className="flex justify-between text-[10px] font-mono font-bold opacity-60">
              <span>{progress}%</span>
              {isCompleted && resultData && (
                <span>{(resultData?.r1 ?? resultData?.s ?? 0)} {locale.LoadingImportFileModalWindows.Strings}</span>
              )}
            </div>
            
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isError 
                    ? "bg-red-500" 
                    : isWarning
                      ? "bg-orange-500"
                      : isCompleted 
                        ? "bg-green-500" 
                        : "bg-blue-600"
                }`}
                style={{ width: `${progress}%` }}
              />  
            </div>
          </div>

          {/* Button to close window */}
          {(isCompleted || isWarning || isError) && (
            <button
              onClick={onClose}
              className={`w-full h-[44px] mt-2 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all ${
                isError 
                  ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20"
                  : isWarning
                    ? "bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-600/20"
                    : "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/20"
              }`}
            >
              {locale.LoadingImportFileModalWindows.CloseButtonLabel}
            </button>
          )}

        </div>
      </div>
    </ModalContainer>
  );
};

export default ImportProgressModal;