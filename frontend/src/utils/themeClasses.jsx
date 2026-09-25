export function getThemeClasses(theme) {
    const isDark = theme === "dark";

    return {
        app: isDark
            ? "bg-[#050505] text-white"
            : "bg-slate-50 text-slate-900",
        card: isDark
            ? "bg-[#111111] border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-800",
        bg: "bg-transparent",
        field: isDark
            ? "bg-white/5 border-white/10 text-white focus:border-purple-500/50"
            : "bg-slate-100 border-slate-200 text-slate-700 focus:border-blue-500/50",
        solidField: isDark
            ? "bg-slate-800 border-white/10 text-white focus:border-purple-500/50"
            : "bg-slate-100 border-slate-200 text-slate-700 focus:border-blue-500/50",
        button: isDark
            ? "bg-white/5 border-white/10 text-white focus:border-purple-500/50"
            : "bg-slate-100 border-slate-200 text-slate-700 focus:border-blue-500/50",
        section: isDark
            ? "bg-black/20 border-white/5"
            : "bg-slate-50/50 border-slate-100",
        label: isDark
            ? "text-slate-500"
            : "text-slate-400",
        btnCopy: isDark
            ? "bg-black/20 border-white/10"
            : "bg-white border-slate-200",
        listMenu: isDark
            ? "bg-[#121212] border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-900",
        tempSection: isDark
            ? "bg-blue-600/5 border-blue-600/10"
            : "bg-blue-50 border-blue-100",
        logoTitle: isDark
            ? "text-white"
            : "text-slate-900",
        navItem: isDark
            ? "text-slate-400 hover:bg-white/5 hover:text-white" 
            : "text-slate-600 hover:bg-blue-600/10 hover:text-blue-600",
        navPanel: isDark
            ? "bg-[#0a0a0a] border-white/5"
            : "bg-white border-slate-200",
        validationError: isDark
            ? "bg-red-500/5 border-red-500/20 text-red-400"
            : "bg-red-500/[0.02] border-red-200 text-red-700",
        divider: isDark
            ? "border-white/5"
            : "border-slate-200",
        footer: isDark
            ? "bg-[#080808]/90 border-white/5" 
            : "bg-white/95 border-slate-200 shadow-2xl",
        logText: isDark
            ? "text-slate-300"
            : "text-slate-700",
        range: `
            h-1.5
            rounded-full
            bg-slate-300
            accent-blue-600
        `
    };
}

export function getLaunchButtonStyle(isStarted, debugMode) {
    if (isStarted) return "bg-red-600 shadow-red-600/40";
    if (debugMode) return "bg-amber-500 shadow-amber-500/40";
    return "bg-blue-600 shadow-blue-600/20";
}