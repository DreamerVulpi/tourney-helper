import React from "react";

export const ActionButton = React.memo(function ActionButton({
  children,
  icon: Icon,

  loading = false,
  disabled = false,

  expandOnHover = false,
  collapsedWidth = "w-14",
  expandedWidth = "hover:w-52",

  className = "",
  iconClassName = "",

  onClick,
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`
        relative
        flex
        items-center
        justify-center
        overflow-hidden
        h-14
        rounded-2xl
        font-black
        text-lg
        uppercase
        tracking-wider
        italic
        duration-300
        shadow-xl
        group
        text-white

        ${
          expandOnHover
            ? `${collapsedWidth} px-0 ${expandedWidth}`
            : "px-10"
        }

        ${
          isDisabled
            ? "opacity-40 cursor-not-allowed grayscale"
            : "hover:scale-[1.02] active:scale-95"
        }

        ${className}
      `}
    >
      {/* Центрирующий контейнер по обеим осям */}
      <div
        className={`
          flex items-center justify-center
          ${expandOnHover ? "gap-0 group-hover:gap-3 duration-300" : "gap-4"}
        `}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />

            <span
              className={
                expandOnHover
                  ? `
                    max-w-0
                    overflow-hidden
                    whitespace-nowrap
                    opacity-0
                    duration-300
                    group-hover:max-w-[200px]
                    group-hover:opacity-100
                  `
                  : ""
              }
            >
              {children}
            </span>
          </>
        ) : (
          <>
            {Icon && (
              <div className="flex items-center justify-center w-5 shrink-0">
                <Icon size={20} className={`shrink-0 ${iconClassName}`} />
              </div>
            )}

            <span
              className={
                expandOnHover
                  ? `
                    flex
                    items-center
                    max-w-0
                    overflow-hidden
                    whitespace-nowrap
                    opacity-0
                    duration-300
                    group-hover:max-w-[200px]
                    group-hover:opacity-100
                  `
                  : ""
              }
            >
              {children}
            </span>
          </>
        )}
      </div>
    </button>
  );
});