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
        input: isDark
            ? "bg-white/5 border-white/10 text-white focus:border-purple-500/50"
            : "bg-slate-100 border-slate-200 text-slate-700 focus:border-blue-500/50",
        label: isDark
            ? "text-slate-400"
            : "text-slate-500",
        section: isDark
            ? "bg-black/20 border-white/5"
            : "bg-slate-50/50 border-slate-100",
        textMuted: isDark
            ? "text-slate-500"
            : "text-slate-400",
        btnBg: isDark
            ? "bg-white/5 border-white/10"
            : "bg-slate-100 border-slate-200",
        btnCopy: isDark
            ? "bg-black/20 border-white/10"
            : "bg-white border-slate-200",
    };
}

export function getLaunchButtonStyle(isStartedSending, debugMode) {
    if (isStartedSending) return "bg-red-600 shadow-red-600/40";
    if (debugMode) return "bg-amber-500 shadow-amber-500/40";
    return "bg-blue-600 shadow-blue-600/20";
}