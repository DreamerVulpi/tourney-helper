import { AlertTriangle, Check } from "lucide-react";

import { Modal } from "../components/layout/Modal.jsx";

export function ValidationModal({
  isOpen,
  onClose,
  message,
  locale,
  themeClasses,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locale.ErrorFillParams}
      icon={AlertTriangle}
      iconColor="red"
      themeClasses={themeClasses}
      footer={
        <div className={`p-6 border-t ${themeClasses.divider}`}>
          <button
            type="button"
            onClick={onClose}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-3
              h-14
              rounded-xl
              font-black
              uppercase
              italic
              tracking-wider
              transition-all
              text-white
              bg-red-600
              hover:bg-red-500
              active:scale-[0.98]
            "
          >
            <Check size={18} />
            {locale.OkButtonLabel}
          </button>
        </div>
      }
    >
      <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
        <p
          className={`text-xs leading-relaxed ${themeClasses.textMuted}`}
        >
          {locale.NeedCorrectConfig}
        </p>

        <div
          className={`
            flex
            flex-col
            items-center
            text-center
            p-5
            rounded-xl
            border
            ${themeClasses.validationError}
          `}
        >
          <p className="text-[11px] font-semibold leading-relaxed max-w-sm">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}