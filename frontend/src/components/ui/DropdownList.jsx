import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function DropdownList({
  value,
  items,
  onChange,
  icon: Icon,
  themeClasses,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
                    flex items-center gap-[0.5rem]
                    px-[0.625rem]
                    h-[2rem]
                    rounded-[0.5rem]
                    border
                    text-[0.625rem]
                    font-bold
                    uppercase
                    tracking-widest
                    transition-all
                    ${themeClasses.langButton}
                    ${className}
                `}
      >
        {Icon && (
          <Icon
            style={{
              width: "0.875rem",
              height: "0.875rem",
            }}
            className="text-blue-600"
          />
        )}

        <span className="leading-none">{value}</span>

        <ChevronDown
          style={{
            width: "0.75rem",
            height: "0.75rem",
          }}
          className="opacity-50"
        />
      </button>

      {isOpen && (
        <div
          className={`
                        absolute
                        right-0
                        mt-[0.5rem]
                        w-[7rem]
                        border
                        rounded-[0.5rem]
                        shadow-xl
                        py-[0.25rem]
                        z-[100]
                        ${themeClasses.langMenu}
                    `}
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onChange(item.value);
                setIsOpen(false);
              }}
              className="
                                w-full
                                text-left
                                px-[1rem]
                                py-[0.45rem]
                                text-[0.625rem]
                                font-bold
                                uppercase
                                hover:bg-blue-600
                                hover:text-white
                                transition-colors
                            "
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
