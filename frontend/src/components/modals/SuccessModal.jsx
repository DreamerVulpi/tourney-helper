import React from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal.jsx";

export function SuccessModal({
  isOpen,
  onClose,
  message,
  locale,
  themeClasses,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locale.ImportSuccessTitle}
      icon={CheckCircle2}
      iconColor="green"
      themeClasses={themeClasses}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="
            w-full flex items-center justify-center gap-3
            h-14 rounded-xl font-black uppercase italic tracking-wider
            text-white bg-green-600 hover:bg-green-500 active:scale-[0.98]
            transition-all
          "
        >
          <Check size={18} />
          {locale?.OkButtonLabel}
        </button>
      }
    >
      <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
        <div
          className={`
            flex flex-col items-center text-center p-5 rounded-xl border
            ${themeClasses.validationSuccess || "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"}
          `}
        >
          <p className="text-[11px] font-semibold leading-relaxed max-w-sm break-all">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}