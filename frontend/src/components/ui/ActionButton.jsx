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
            ? `${collapsedWidth} justify-center px-0 gap-0 ${expandedWidth}`
            : "px-10 gap-4"
        }

        ${
          isDisabled
            ? "opacity-40 cursor-not-allowed grayscale"
            : "hover:scale-[1.02] active:scale-95"
        }

        ${className}
      `}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

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
                  group-hover:ml-3
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
              <Icon
                size={20}
                className={`shrink-0 ${iconClassName}`}
              />
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
                  group-hover:ml-3
                `
                : ""
            }
          >
            {children}
          </span>
        </>
      )}
    </button>
  );
});