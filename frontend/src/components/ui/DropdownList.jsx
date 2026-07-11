import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function DropdownList({
  selectedValue,
  items,
  onChange,
  icon: Icon,
  iconSize = 16,
  themeClasses,
  className = "",
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        style={style}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          w-full
          flex
          items-center
          justify-between
          rounded-xl
          border
          transition-all
          ${themeClasses.field}
          ${className}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <Icon
              size={iconSize}
              className="text-blue-600 shrink-0"
            />
          )}

          <span className="truncate text-xs font-bold">
            {selectedValue}
          </span>
        </div>

        <ChevronDown
          size={iconSize}
          className={`opacity-60 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`
            absolute
            left-0
            top-full
            mt-2
            w-full
            overflow-hidden
            rounded-xl
            border
            shadow-xl
            z-50
            ${themeClasses.field}
          `}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                onChange(item.value);
                setIsOpen(false);
              }}
              className={`
                w-full
                text-left
                px-4
                py-2
                text-xs
                font-bold
                transition-colors
                hover:bg-blue-600
                hover:text-white
                ${themeClasses.listMenu}
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}