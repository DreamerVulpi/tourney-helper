export function NavItem({
  icon,
  label,
  active,
  onClick,
  themeClasses,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl  duration-300 relative group overflow-hidden mb-1 ${
        active
          ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] scale-[1.02]"
          : themeClasses.navItem
      }`}
    >
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-[2px_0_10px_rgba(255,255,255,0.5)] z-20" />
      )}

      <span
        className={`relative z-10 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </span>

      <span
        className={`relative z-10 hidden lg:block text-[10px] font-black uppercase tracking-[0.1em] text-left leading-tight italic  ${
          active
            ? "text-white opacity-100"
            : "opacity-70 group-hover:opacity-100"
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
