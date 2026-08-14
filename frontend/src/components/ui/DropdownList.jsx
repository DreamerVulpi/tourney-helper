import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export function DropdownList({
  editable = false,
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
  const dropdownRef = useRef(null);
  const [inputValue, setInputValue] = useState(selectedValue);
  const displayValue =
  items.find((item) => String(item.value) === String(selectedValue))?.label ?? selectedValue;
  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const filteredItems = editable
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          item.value.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : items;

  return (
    <div ref={dropdownRef} className="relative w-full">
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
          
          ${themeClasses.field}
          ${className}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={iconSize} className="text-blue-600 shrink-0" />}

          {editable ? (
            <input
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value.replace(/^\s+/, "");
                setInputValue(value);
                onChange(value);
                setIsOpen(true);
              }}
              onClick={(e) => e.stopPropagation()}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = inputValue.trim();
                  setInputValue(value);
                  onChange(value);
                  setIsOpen(false);
                }

                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              className={`
                w-full
                bg-transparent
                outline-none
                text-xs
                font-bold
              `}
            />
          ) : (
            <span className="truncate text-xs font-bold">{selectedValue}</span>
          )}
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
            z-[100]
            ${themeClasses.field}
          `}
        >
          {filteredItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setInputValue(item.label);
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
