import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { HIDDEN_MENU_STYLE, useFloatingMenu } from "./useFloatingMenu.jsx";

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
  const { menuRef, menuStyle } = useFloatingMenu({
    anchorRef: dropdownRef,
    open: isOpen,
  });
  const [inputValue, setInputValue] = useState(selectedValue);
  const displayValue =
  items.find((item) => String(item.value) === String(selectedValue))?.label ?? selectedValue;
  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  useEffect(() => {
    const handler = (e) => {
      const inAnchor = dropdownRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inAnchor && !inMenu) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [menuRef]);

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
          min-w-0
          flex
          items-center
          justify-between
          gap-2
          overflow-hidden
          rounded-xl
          border
          
          ${themeClasses.field}
          ${className}
        `}
      >
        <div className="flex flex-1 items-center gap-2 min-w-0 overflow-hidden">
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
                min-w-0
                bg-transparent
                outline-none
                text-xs
                font-bold
              `}
            />
          ) : (
            <span className="truncate flex-1 min-w-0 text-xs font-bold">{selectedValue}</span>
          )}
        </div>

        <ChevronDown
          size={iconSize}
          className={`opacity-60 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle ?? HIDDEN_MENU_STYLE}
            className={`
              overflow-hidden
              rounded-xl
              border
              shadow-xl
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
                  truncate
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
          </div>,
          document.body,
        )}
    </div>
  );
}
