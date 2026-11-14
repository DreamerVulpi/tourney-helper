import React, { useEffect, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";

import { Modal } from "./Modal.jsx";
import { Field } from "../ui/Field.jsx";

const BUTTON_COLORS = {
  amber: "bg-amber-600 hover:bg-amber-500",
  blue: "bg-blue-600 hover:bg-blue-500",
  green: "bg-green-600 hover:bg-green-500",
  red: "bg-red-600 hover:bg-red-500",
};

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
  resetValue,
  resetLabel = "Reset",
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
        ${BUTTON_COLORS[iconColor] ?? BUTTON_COLORS.amber}
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
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
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
          </div>

          {resetValue !== undefined && (
            <button
              type="button"
              onClick={() => {
                setValue(String(resetValue));
                setError(null);
              }}
              title={resetLabel}
              aria-label={resetLabel}
              className={`flex shrink-0 items-center justify-center h-[2.1rem] w-[2.1rem] rounded-xl border transition-colors ${themeClasses.button}`}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-500 font-bold px-1">{error}</div>
        )}
      </div>
    </Modal>
  );
};

export default PromptModal;