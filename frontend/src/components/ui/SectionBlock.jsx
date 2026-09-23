import React from "react";
import { getThemeClasses } from "../../utils/themeClasses.jsx";

function SectionBlockBase({
  title,
  icon: Icon,

  titleAlign = "left",     // "left" | "center"
  iconColor = "text-blue-500",

  headerRight,

  children,

  className = "",
  headerClassName = "",

  theme,                    // "dark" | "light" — приходит снаружи
}) {
  const themeClasses = getThemeClasses(theme);
  const isCentered = titleAlign === "center";

  return (
    <section
      className={`
        p-4
        rounded-2xl
        border
        space-y-3
        duration-300
        max-h-[40vh]
        custom-scrollbar
        overflow-y-auto
        ${themeClasses.tempSection}
        ${className}
      `}
    >
      {title && (
        <div
          className={`
            flex
            items-center
            border-b
            pb-2
            border-current/5
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

      {children}
    </section>
  );
}

export const SectionBlock = React.memo(SectionBlockBase);