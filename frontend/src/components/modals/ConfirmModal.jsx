import React from "react";
import { AlertTriangle } from "lucide-react";

import { Modal } from "./Modal.jsx";
import { MessageBox } from "./MessageBox.jsx";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title,
  message,
  confirmLabel = "Confirm",
  icon: Icon = AlertTriangle,
  iconColor = "red",
  iconColorClass = "text-red-500",
  borderClass,
  textClass,
  danger = true,
  theme = "dark",
  themeClasses,
}) => {
  if (!isOpen) return null;

  const isDark = theme === "dark";

  const resolvedBorder =
    borderClass ??
    (danger
      ? isDark
        ? "bg-red-500/10 border-red-500/20"
        : "bg-red-50 border-red-200"
      : isDark
        ? "bg-blue-500/10 border-blue-500/20"
        : "bg-blue-50 border-blue-200");

  const resolvedText =
    textClass ?? (isDark ? "text-slate-300" : "text-slate-600");

  const btnBg = danger
    ? "bg-red-600 hover:bg-red-500"
    : "bg-blue-600 hover:bg-blue-500";

  const footer = (
    <button
      onClick={onConfirm}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-3
        h-[56px] rounded-xl
        font-black uppercase italic tracking-wider text-white
        ${btnBg}
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {Icon && <Icon size={18} />}
      {confirmLabel}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={Icon}
      iconColor={iconColor}
      themeClasses={themeClasses}
      footer={footer}
    >
      <div className="p-8">
        <MessageBox
          icon={Icon}
          iconColor={iconColorClass}
          borderClass={resolvedBorder}
          textClass={resolvedText}
        >
          {message}
        </MessageBox>
      </div>
    </Modal>
  );
};

export default ConfirmModal;