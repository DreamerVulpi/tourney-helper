import { useState } from "react";

export default function ExpandableAction({
  icon,
  items = [],
  width = "220px",
  collapsedWidth = "56px",
  collapsedClassName = "",
  className = "",
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative h-[56px] shrink-0 transition-[width] duration-300 ${className}`}
      style={{
        width: isHovered ? width : collapsedWidth,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Front side */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-xl font-black text-xs uppercase italic transition-all duration-300 ease-out z-10 ${collapsedClassName} ${
          isHovered
            ? "opacity-0 scale-95 pointer-events-none"
            : "opacity-100 scale-100"
        }`}
      >
        {icon}
      </div>

      {/* Back side */}
      <div
        className={`absolute inset-0 flex gap-0.5 transition-all duration-300 ease-out z-20 ${
          isHovered
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {items.map((item, index) => (
          <button
            key={item.id ?? index}
            onClick={item.onClick}
            disabled={item.disabled}
            className={`flex flex-col items-center justify-center transition-colors ${
              index === 0 ? "rounded-l-xl" : ""
            } ${
              index === items.length - 1 ? "rounded-r-xl" : ""
            } ${item.className ?? ""}`}
            style={{
              flex: item.flex ?? 1,
            }}
          >
            {item.icon}

            {item.label && (
              <span
                className={
                  item.labelClassName ??
                  "text-[0.625rem] font-black uppercase mt-1 text-center px-1"
                }
              >
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}