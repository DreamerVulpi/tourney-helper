import React from "react";
import { getThemeClasses } from "../../utils/themeClasses.jsx";

function SectionBlockBase({
  title,
  icon: Icon,
  solid = false,

  titleAlign = "left",     // "left" | "center"
  iconColor = "text-blue-500",

  headerRight,

  children,

  className = "",
  headerClassName = "",

  theme,                    // "dark" | "light"
}) {
  const themeClasses = getThemeClasses(theme);
  const isCentered = titleAlign === "center";

  // ── Поверхность секции ─────────────────────────────────────
  // solid  → 1-в-1 как Field (solidField), без tempSection/field
  // обычный → прежний вид секции
  const surfaceClasses = solid
    ? `${themeClasses.solidField} rounded-xl px-3 py-2`
    : `${themeClasses.tempSection} ${themeClasses.field} rounded-2xl p-4`;

  return (
    <section
      className={`
        border
        duration-300
        w-full
        max-h-[40vh]
        custom-scrollbar
        overflow-y-auto
        ${surfaceClasses}
        ${className}
      `}
    >
      {title && (
        <div
          className={`
            flex
            items-center
            border-b
            border-current/5
            ${solid ? "pb-1.5 mb-2" : "pb-2 mb-3"}
            ${isCentered ? "justify-center" : "justify-between"}
            ${headerClassName}
          `}
        >
          <h4
            className={`
              text-[9px]
              font-black
              uppercase
              italic
              flex
              items-center
              gap-1.5
              ${iconColor}
            `}
          >
            {Icon && <Icon size={12} strokeWidth={2.5} />}
            <span>{title}</span>
          </h4>

          {headerRight && (
            <div className="shrink-0">{headerRight}</div>
          )}
        </div>
      )}

      {/* Контент: в solid меньше вертикальный отступ, как у Field */}
      <div className={solid ? "space-y-2" : "space-y-3"}>
        {children}
      </div>
    </section>
  );
}

export const SectionBlock = React.memo(SectionBlockBase);