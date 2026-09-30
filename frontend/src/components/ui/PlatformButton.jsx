import React from "react";
import { Settings2 } from "lucide-react";

function PlatformBtnBase({
  label,
  active,
  disabled,
  onClick,
  onSettingsClick,
  themeClasses,
  slotsCount,
  authorizedCount,
  reauthCount,
}) {
  const showCount = typeof slotsCount === "number" && slotsCount > 0;
  const authorized = typeof authorizedCount === "number" ? authorizedCount : 0;
  const reauth = typeof reauthCount === "number" ? reauthCount : 0;

  return (
    <div className="relative group/btn">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full h-[2.8rem] flex items-center justify-center py-[0.25rem] rounded-xl border relative overflow-hidden ${themeClasses.field} ${
          disabled
            ? "opacity-30 cursor-not-allowed"
            : active
              ? "bg-blue-600/10 border-blue-600 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
              : `${themeClasses.btnSecondary}`
        }`}
      >
        <span className="text-[10px] font-black uppercase italic tracking-wider leading-none z-10">
          {label}
        </span>
      </button>

      {showCount && (
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 z-20">
          <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1 py-0.5">
            {authorized}/{slotsCount}
          </span>
          {reauth > 0 && (
            <span className="text-[8px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded px-1 py-0.5">
              !{reauth}
            </span>
          )}
        </span>
      )}

      {!disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick();
          }}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg z-20 ${
            active
              ? "text-blue-600 hover:bg-blue-600/20"
              : "text-slate-500 hover:bg-slate-500/10"
          }`}
        >
          <Settings2 size={14} />
        </button>
      )}
    </div>
  );
}

export const PlatformBtn = React.memo(PlatformBtnBase);