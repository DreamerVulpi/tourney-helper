export function getThemeClasses(theme) {
    const isDark = theme === "dark";

    return {
        navItem: isDark
            ? "text-slate-400 hover:bg-white/5 hover:text-white" 
            : "text-slate-600 hover:bg-blue-600/10 hover:text-blue-600",
        navPanel: isDark
            ? "bg-[#0a0a0a] border-white/5"
            : "bg-white border-slate-200",
    };
}