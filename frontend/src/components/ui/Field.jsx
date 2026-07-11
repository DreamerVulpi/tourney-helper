import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { DropdownList } from "./DropdownList.jsx";
import { CopyButton } from "./CopyButton.jsx";

export function Field({
  label,
  width = "100%",
  icon: Icon,

  variant = "input", // input | password | select | copy
  type = "text",

  value,
  onChange,

  items = [],

  placeholder = "",

  height = "2.1rem",

  themeClasses,
}) {
  const iconSize = Math.round(parseFloat(height) * 16 * 0.45);

  const [showSecret, setShowSecret] = useState(false);

  const inputType =
    variant === "password" ? (showSecret ? "text" : "password") : type;

  return (
    <div className="space-y-1.5" style={{ width }}>
      {label && (
        <label
          className={`text-[9px] font-black uppercase italic px-1 ${themeClasses.label}`}
        >
          {label}
        </label>
      )}

      {variant === "select" ? (
        <DropdownList
          selectedValue={
            items.find((item) => String(item.value) === String(value))?.label ?? value
          }
          items={items}
          onChange={onChange}
          icon={Icon}
          iconSize={iconSize}
          themeClasses={themeClasses}
          className="px-4 text-xs font-bold"
          style={{ height }}
        />
      ) : variant === "copy" ? (
        <div
          style={{ height }}
          className={`
            relative
            flex
            items-center
            rounded-xl
            border
            border-dashed
            px-3
            ${themeClasses.field}
          `}
        >
          <div className="flex items-center justify-center w-full gap-2">
            {Icon && (
              <Icon size={iconSize} className="text-blue-600 shrink-0" />
            )}

            <span className="truncate text-xs font-mono font-bold text-blue-600">{value}</span>
          </div>

          <CopyButton text={value} className="absolute right-2" />
        </div>
      ) : (
        <div className="relative flex items-center">
          {Icon && (
            <Icon
              size={iconSize}
              className="absolute left-3 text-blue-600 pointer-events-none z-10"
            />
          )}

          <input
            type={inputType}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={{ height }}
            className={`
              w-full
              rounded-xl
              border
              outline-none
              transition-all
              ${variant === "password" ? "pr-9" : "pr-4"}
              ${Icon ? "pl-9" : "px-4"}
              text-xs
              font-bold
              ${themeClasses.field}
            `}
          />

          {variant === "password" && (
            <button
              type="button"
              onClick={() => setShowSecret((prev) => !prev)}
              className="absolute right-3 text-slate-500 hover:text-blue-500 transition-colors"
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
