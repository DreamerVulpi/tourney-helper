import React from "react";

function ToggleSwitchBase({
  label,
  icon: Icon,

  // Старый вариант (2 состояния)
  checked = false,
  onChange,

  // Новый вариант (N состояний)
  value,
  options,

  color = "blue",
  solid = false,

  themeClasses,
}) {
  const colors = {
    blue: {
      container: "bg-blue-500/5 border-blue-500/10",
      icon: "text-blue-500",
      active: "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]",
      inactive: "bg-slate-700",
      segmentActive: "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]",
      segmentInactive: "text-slate-400 hover:text-slate-200",
    },
    amber: {
      container: "bg-amber-500/5 border-amber-500/10",
      icon: "text-amber-500",
      active: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
      inactive: "bg-slate-700",
      segmentActive: "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]",
      segmentInactive: "text-slate-400 hover:text-slate-200",
    },
    green: {
      container: "bg-green-500/5 border-green-500/10",
      icon: "text-green-500",
      active: "bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]",
      inactive: "bg-slate-700",
      segmentActive: "bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.3)]",
      segmentInactive: "text-slate-400 hover:text-slate-200",
    },
    red: {
      container: "bg-red-500/5 border-red-500/10",
      icon: "text-red-500",
      active: "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]",
      inactive: "bg-slate-700",
      segmentActive: "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]",
      segmentInactive: "text-slate-400 hover:text-slate-200",
    },
  };

  const style = colors[color] || colors.blue;
  const hasOptions = Array.isArray(options) && options.length > 0;

  // ============================================================
  // Вариант с N секциями — label сверху, сегменты на всю ширину
  // ============================================================
  if (hasOptions) {
    return (
      <div
        className={`
          w-full
          flex
          flex-col
          p-3
          rounded-xl
          border
          gap-2
          ${solid
            ? (themeClasses.solidField || 'bg-slate-800 border-white/10 text-white')
            : `${themeClasses.field} ${style.container}`
          }
        `}
      >
        {label && (
          <span className="text-[10px] font-black uppercase italic leading-none text-center">
            {label}
          </span>
        )}

        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5 w-full">
          {options.map((opt) => {
            const isActive = opt.value === value;
            const OptIcon = opt.icon;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                title={opt.label}
                className={`
                  flex-1
                  flex
                  items-center
                  justify-center
                  gap-1
                  px-2.5
                  py-1
                  rounded-md
                  text-[10px]
                  font-black
                  uppercase
                  italic
                  transition-all
                  ${isActive ? style.segmentActive : style.segmentInactive}
                `}
              >
                {OptIcon && <OptIcon size={12} />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================
  // Старый вариант (вкл/выкл) — как было
  // ============================================================
  return (
    <div
      className={`
        w-full
        flex
        items-center
        justify-between
        p-3
        rounded-xl
        border
        gap-3
        ${themeClasses.field}
        ${style.container}
      `}
    >
      <div className="flex items-center gap-3 shrink-0 min-w-0">
        {Icon && (
          <Icon
            size={18}
            className={style.icon}
          />
        )}

        {label && (
          <span className="text-[10px] font-black uppercase italic leading-none truncate">
            {label}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative
          w-10
          h-5
          rounded-full
          shrink-0
          transition-colors
          ${checked ? style.active : style.inactive}
        `}
      >
        <div
          className={`
            absolute
            top-0.5
            w-4
            h-4
            bg-white
            rounded-full
            transition-all
            ${checked ? "right-0.5" : "left-0.5"}
          `}
        />
      </button>
    </div>
  );
}

export const ToggleSwitch = React.memo(ToggleSwitchBase);