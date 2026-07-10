export function getThemeClasses(theme) {
    const isDark = theme === "dark";

    return {
        header: isDark
            ? "bg-[#0a0a0a] border-white/5"
            : "bg-white border-slate-200",

        logoTitle: isDark
            ? "text-white"
            : "text-slate-900",

        langButton: isDark
            ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
            : "bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200",

        langMenu: isDark
            ? "bg-[#121212] border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-900",

        themeButton: isDark
            ? "bg-white/5 border-white/10"
            : "bg-slate-100 border-slate-200",

        sunIcon: isDark
            ? "text-slate-500"
            : "bg-white shadow-sm text-amber-500 scale-110",

        moonIcon: isDark
            ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/20"
            : "text-slate-400",

        divider: isDark
            ? "border-white/10"
            : "border-slate-200",
    };
}