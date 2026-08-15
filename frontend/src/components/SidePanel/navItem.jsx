export function NavItem({
  icon,
  label,
  active,
  onClick,
  themeClasses,
  collapsed,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center relative group overflow-hidden mb-1
        duration-300
        ${
          collapsed
            ? "w-12 h-12 p-0 gap-0 justify-center mx-auto rounded-2xl"
            : "w-full p-4 gap-4 rounded-2xl"
        }
        ${
          active
            ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] scale-[1.02]"
            : themeClasses.navItem
        }
      `}
    >
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-[2px_0_10px_rgba(255,255,255,0.5)] z-20" />
      )}

      <span
        className={`relative z-10 shrink-0 transition-transform duration-300 ${
          active ? "scale-110" : "group-hover:scale-110"
        }`}
      >
        {icon}
      </span>

      <span
        className={`relative z-10 text-[10px] font-black uppercase tracking-[0.1em] text-left leading-tight italic overflow-hidden whitespace-nowrap transition-all duration-300 ${
          collapsed
            ? "max-w-0 opacity-0"
            : "max-w-[240px] opacity-70 group-hover:opacity-100"
        } ${
          active
            ? "text-white opacity-100"
            : ""
        }`}
      >
        {label}
      </span>

      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none animate-pulse" />
      )}
    </button>
  );
}