import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import { Modal } from "./Modal.jsx";
import { Field } from "../ui/Field.jsx";

const PromptModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title,
  label = "Name",
  placeholder = "",
  defaultValue = "",
  confirmLabel = "Save",
  validate,
  icon: Icon = Pencil,
  iconColor = "blue",
  theme = "dark",
  themeClasses,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setValue(defaultValue ?? "");
    setError(null);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (validate) {
      const err = validate(trimmed);
      if (err) {
        setError(err);
        return;
      }
    }
    onConfirm(trimmed);
  };

  const footer = (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-3
        h-[56px] rounded-xl
        font-black uppercase italic tracking-wider text-white
        bg-amber-600 hover:bg-amber-500
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
      <div className="p-8 space-y-3">
        <Field
          label={label}
          value={value}
          onChange={(v) => {
            setValue(v);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          themeClasses={themeClasses}
        />
        {error && (
          <div className="text-xs text-red-500 font-bold px-1">{error}</div>
        )}
      </div>
    </Modal>
  );
};

export default PromptModal;