import { Lock } from "lucide-react";
import { SERVICE_STATUS } from "../../utils/listStatus";

export function NavItem({
  icon,
  label,
  content,
  active,
  onClick,
  themeClasses,
  collapsed,
  disabled = false,
  lockTooltip,
  status = SERVICE_STATUS.OFF,
  showStatus = true,
  iconOnly = false,
}) {
  const statusClasses = {
    [SERVICE_STATUS.OFF]: "bg-gray-400",
    [SERVICE_STATUS.STARTING]:
      "bg-orange-400 animate-pulse",
    [SERVICE_STATUS.RUNNING]:
      "bg-green-500",
    [SERVICE_STATUS.ERROR]: "bg-red-500",
  };

  const iconScale = collapsed
    ? "scale-90"
    : active
      ? "scale-110"
      : "group-hover:scale-110";

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={disabled && lockTooltip ? lockTooltip : undefined}
      className={`
      flex items-center relative overflow-hidden group mb-1
      duration-300

      ${
        content
          ? collapsed
            ? "w-full h-12 p-0 justify-center rounded-2xl"
            : "w-full h-12 p-0 pl-3 justify-start gap-2 rounded-2xl"
          : iconOnly
            ? "w-9 h-12 p-0 gap-0 justify-center mx-auto rounded-xl"
            : collapsed
              ? "w-12 h-12 p-0 gap-0 justify-center mx-auto rounded-2xl"
              : "w-full p-4 gap-4 rounded-2xl"
      }

      ${
        disabled
          ? "cursor-not-allowed"
          : active
            ? "bg-blue-600 text-white scale-[1.02]"
            : themeClasses.navItem
      }
    `}
    >
      {active && !disabled && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full z-20" />
      )}

      <span
        className={`
        relative z-10 shrink-0
        transition-transform duration-300
        ${iconScale}
      `}
      >
        {icon}
        {/* status indicator */}
        {showStatus && !disabled && (
          <span
            className={`
            absolute -right-1 -bottom-1
            w-2.5 h-2.5
            rounded-full
            border-1
            ${themeClasses.statusBorder}
            ${statusClasses[status]}
          `}
          />
        )}

      {/* locked panel */}
      {disabled && (
      <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <span
          className={`
            flex items-center justify-center
            w-8 h-8 shrink-0 aspect-square rounded-[10px]
            ring-3
            ${themeClasses.lockPanel}
          `}
        >
          <Lock size={16} strokeWidth={3} />
        </span>
      </span>
    )}
      </span>

      {content ? (
        <div
          className={`
          relative z-10

          shrink-0
          whitespace-nowrap
          transition-all duration-300
          ${collapsed ? "max-w-0 opacity-0" : "max-w-[500px] opacity-100"}
        `}
        >
          {content}
        </div>
      ) : (
        <span
          className={`
          relative z-10
          text-[10px]
          font-black
          uppercase
          tracking-[0.1em]
          text-left
          leading-tight
          italic
          overflow-hidden
          whitespace-nowrap
          transition-all duration-300
          ${
            collapsed
              ? "max-w-0 opacity-0"
              : "max-w-[240px] opacity-70 group-hover:opacity-100"
          }
          ${active && !disabled ? "text-white opacity-100" : ""}
        `}
            >
              {label}
            </span>
          )}

      {active && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none animate-pulse" />
      )}
    </button>
  );
}