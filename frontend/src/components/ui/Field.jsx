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
  isNumber,
  isTextArea,

  value,
  onChange,
  onClick,
  labelButton,

  items = [],

  placeholder = "",

  height = "2.1rem",

  themeClasses,
}) {
  const iconSize = height.endsWith("rem")
  ? Math.round(parseFloat(height) * 16 * 0.45)
  : height.endsWith("px")
  ? Math.round(parseFloat(height) * 0.45)
  : 16;

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
      ) : variant === "button" ? (
            <button
              type="button"
              onClick={onClick}
              style={{ height }}
              className={`
                w-full
                flex
                rounded-xl
                border
                transition-all
                gap-2
                text-xs
                items-center
                justify-center
                font-black
                uppercase
                italic
                text-black
                ${themeClasses.button}
              `}
            >
              {Icon && (
                <Icon
                  size={iconSize}
                  className="left-3 text-blue-600 pointer-events-none z-10"
                />
              )}

              <span>
                {labelButton}
              </span>
            </button>
      ) : variant === "textarea" ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-24 p-3 rounded-xl text-sm font-medium border resize-none focus:outline-none custom-scrollbar ${themeClasses.field}`}
        />
      ) : variant === "mono" ? (
        <div
          className={`
            p-4
            rounded-xl
            border
            space-y-2.5
            font-mono
            text-xs
            whitespace-pre-wrap
            break-words
            ${
              themeClasses.field
            }
          `}
        >
          {value}
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
            inputMode={isNumber ? "numeric" : ""}
            pattern={isNumber ? "[0-9]*" : ""}
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
