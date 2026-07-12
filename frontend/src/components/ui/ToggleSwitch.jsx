export function ToggleSwitch({
  label,
  icon: Icon,

  checked = false,
  onChange,

  color = "blue",

  themeClasses,
}) {
  const colors = {
    blue: {
      container: "bg-blue-500/5 border-blue-500/10",
      icon: "text-blue-500",
      active: "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]",
    },

    amber: {
      container: "bg-amber-500/5 border-amber-500/10",
      icon: "text-amber-500",
      active: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    },

    green: {
      container: "bg-green-500/5 border-green-500/10",
      icon: "text-green-500",
      active: "bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]",
    },

    red: {
      container: "bg-red-500/5 border-red-500/10",
      icon: "text-red-500",
      active: "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]",
    },
  };

  const style = colors[color] || colors.blue;

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
        ${themeClasses.field}
        ${style.container}
      `}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            size={18}
            className={style.icon}
          />
        )}

        <span className="text-[10px] font-black uppercase italic leading-none">
          {label}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative
          w-10
          h-5
          rounded-full
          transition-all
          ${
            checked
              ? style.active
              : "bg-slate-700"
          }
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
            ${
              checked
                ? "right-0.5"
                : "left-0.5"
            }
          `}
        />
      </button>
    </div>
  );
}