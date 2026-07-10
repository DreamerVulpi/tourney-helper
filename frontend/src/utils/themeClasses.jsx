export function getThemeClasses(theme) {
    const isDark = theme === "dark";

    return {
        // Общие
        app: isDark
            ? "bg-[#050505] text-white"
            : "bg-slate-50 text-slate-900",

        card: isDark
            ? "bg-[#111111] border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-800",

        bg: isDark
            ? "bg-black"
            : "bg-slate-50",

        input: isDark
            ? "bg-transparent border-white/10 text-white focus:border-purple-500/50"
            : "bg-transparent border-slate-200 text-slate-700 focus:border-blue-500/50",

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
            ? "bg-black/20"
            : "bg-slate-100",
    };
}