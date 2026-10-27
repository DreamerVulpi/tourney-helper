import React, { useState } from "react";
import { Eye, EyeOff, ZoomOut, ZoomIn, RotateCcw, Check, ChevronDown } from "lucide-react";

import { MultiSelectList } from "./MultiSelectList.jsx";
import { DropdownList } from "./DropdownList.jsx";
import { CopyButton } from "./CopyButton.jsx";

function FieldBase({
  label,
  labelPosition = "top", // top | left
  labelWidth = "auto",

  width = "100%",
  icon: Icon,

  variant = "input", // input | password | select | copy | button | textarea | mono | combobox
  type = "text",
  isNumber,
  readOnly = false,

  min = 0.0,
  max = 1.0,
  step,
  showReset = true,
  solid = false,

  value,
  onChange,
  onClick,
  labelButton,

  items = [],

  placeholder = "",

  height = "2.1rem",
  searchable = false,
  single = false,
  maxVisible = 3,
  locale,
  renderItem,
  onRename,
  validateRename,

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

  const field = (
    <>
      {variant === "select" ? (
        <DropdownList
          selectedValue={
            items.find((item) => String(item.value) === String(value))?.label ??
            value
          }
          items={items}
          onChange={onChange}
          icon={Icon}
          iconSize={iconSize}
          themeClasses={themeClasses}
          className="px-4 text-xs font-bold"
          style={{ height }}
        />
      ) : variant === "multiselect" ? (
        <>
        {console.log("[Field] variant=multiselect items:", items, "value:", value)}
        <MultiSelectList
          selectedValues={Array.isArray(value) ? value : []}
          items={items}
          onChange={onChange}
          icon={Icon}
          iconSize={iconSize}
          themeClasses={themeClasses}
          className="px-4 text-xs font-bold"
          style={{ height }}
          maxVisible={maxVisible}
          placeholder={placeholder}
          searchable={searchable}
          single={single}
          locale={locale}
          renderItem={renderItem}
          onRename={onRename}
          validateRename={validateRename}
        />
        </>
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
              <Icon
                size={iconSize}
                className="text-blue-600 shrink-0"
              />
            )}

            <span className="truncate text-xs font-mono font-bold text-blue-600">
              {value}
            </span>
          </div>

          <CopyButton
            text={value}
            className="absolute right-2"
            themeClasses={themeClasses}
          />
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
              className="text-blue-600 pointer-events-none z-10"
            />
          )}

          <span className="leading-none translate-y-[-1px]">
            {labelButton}
          </span>
        </button>
      ) : variant === "textarea" ? (
        <textarea
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full
            ${height}
            p-3
            rounded-xl
            text-sm
            font-medium
            border
            resize-none
            focus:outline-none
            custom-scrollbar
            ${themeClasses.field}
          `}
        />
      ) : variant === "range" ? (
        <div
            className={`
                flex
                items-center
                gap-2
                w-full
                px-3
                py-2
                rounded-xl
                border
                ${solid
                    ? (themeClasses.solidField)
                    : themeClasses.field
                }
            `}
        >
            {label && (
                <span className={`text-[10px] font-black uppercase italic shrink-0 ${themeClasses.label}`}>
                    {label}
                </span>
            )}

            <ZoomOut
                size={14}
                className="shrink-0 opacity-60"
            />

            <input
                type="range"
                min={min ?? 0.5}
                max={max ?? 2.0}
                step={step ?? 0.05}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`
                    flex-1
                    cursor-pointer
                    accent-amber-500
                    ${themeClasses.range ?? ""}
                `}
            />

            <ZoomIn
                size={14}
                className="shrink-0 opacity-60"
            />

            <span className="text-xs font-black italic tabular-nums min-w-[3.2rem] text-right shrink-0">
                {parseFloat(value).toFixed(2)}×
            </span>

            {showReset && (
                <button
                    type="button"
                    onClick={() => onChange(1.0)}
                    disabled={parseFloat(value) === 1.0}
                    className={`
                        w-5 h-5 flex items-center justify-center rounded-md
                        hover:bg-white/10
                        disabled:opacity-30
                        disabled:cursor-not-allowed
                        transition-colors
                        shrink-0
                    `}
                >
                    <RotateCcw size={11} />
                </button>
            )}
        </div>
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
            ${themeClasses.field}
          `}
        >
          {value}
        </div>
      ) : variant === "combobox" ? (
        <DropdownList
          editable
          selectedValue={value}
          items={items}
          onChange={onChange}
          icon={Icon}
          iconSize={iconSize}
          themeClasses={themeClasses}
          className="px-4 text-xs font-bold"
          style={{ height }}
        />
      ) : (
        <div className="relative flex items-center w-full">
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
            readOnly={readOnly}
            onChange={(e) => onChange(e.target.value)}
            style={{ height }}
            className={`
              w-full
              rounded-xl
              border
              outline-none
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
              className="
                absolute
                right-3
                text-slate-500
                hover:text-blue-500
                transition-colors
              "
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      )}
    </>
  );

  const isLeftLabel = labelPosition === "left";

  return (
    <div
      className={
        isLeftLabel
          ? "flex items-center gap-3"
          : "space-y-1.5"
      }
      style={{ width }}
    >
      {label && (
        <label
          style={
            isLeftLabel
              ? { width: labelWidth }
              : undefined
          }
          className={`
            text-xs
            font-black
            uppercase
            italic
            px-1
            shrink-0
            ${themeClasses.label}
          `}
        >
          {label}
        </label>
      )}

      <div
        className={
          isLeftLabel
            ? "flex-1 min-w-0"
            : ""
        }
      >
        {field}
      </div>
    </div>
  );
}

export const Field = React.memo(FieldBase);
