import React from "react";
import { Lock } from "lucide-react";

function PlatformBtnBase({
  label,
  active,
  disabled,
  locked,
  onClick,
  themeClasses,
  slotsCount,
  authorizedCount,
  reauthCount,
}) {
  const showCount = typeof slotsCount === "number" && slotsCount > 0;
  const authorized = typeof authorizedCount === "number" ? authorizedCount : 0;
  const reauth = typeof reauthCount === "number" ? reauthCount : 0;

  const isInactive = disabled || locked;

  const handleClick = (e) => {
    if (isInactive) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type="button"
      disabled={disabled}                      // locked не блокирует фокус полностью, только клик
      aria-disabled={isInactive || undefined}
      onClick={handleClick}
      className={`w-full h-[2.8rem] flex items-center justify-center py-[0.25rem] rounded-xl border relative overflow-hidden transition-colors ${
        disabled
          ? `opacity-30 cursor-not-allowed ${themeClasses.field}`
          : locked
            ? `${themeClasses.field} ${themeClasses.btnSecondary} opacity-50 cursor-not-allowed`
            : active
              ? themeClasses.btnActive
              : `${themeClasses.field} ${themeClasses.btnSecondary} cursor-pointer`
      }`}
    >
      <span className="text-[10px] font-black uppercase italic tracking-wider leading-none z-10">
        {label}
      </span>

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

      {locked && (
        <span className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-slate-950/40">
          <Lock size={14} className="text-slate-300" />
        </span>
      )}
    </button>
  );
}

export const PlatformBtn = React.memo(PlatformBtnBase);