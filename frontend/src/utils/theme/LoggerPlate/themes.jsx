export function getThemeClasses(theme) {
    const isDark = theme === "dark";

    return {
        footer: isDark
            ? "bg-[#080808]/90 border-white/5" 
            : "bg-white/95 border-slate-200 shadow-2xl",
        logText: isDark
            ? "text-slate-300"
            : "text-slate-700",
    };
}