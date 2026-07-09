export function getThemeClasses(theme) {
    return {
        app:
            theme === "dark"
                ? "bg-[#050505] text-white"
                : "bg-slate-50 text-slate-900",
        card:
            theme === "dark"
                ? "bg-[#111111] border-white/10 text-white"
                : "bg-white border-slate-200 text-slate-800",

        bg:
            theme === "dark"
                ? "bg-black"
                : "bg-slate-50",

        input:
            theme === "dark"
                ? "bg-transparent border-white/10 text-white focus:border-purple-500/50"
                : "bg-transparent border-slate-200 text-slate-700 focus:border-blue-500/50",

        label:
            theme === "dark"
                ? "text-slate-400"
                : "text-slate-500",

        section:
            theme === "dark"
                ? "bg-black/20 border-white/5"
                : "bg-slate-50/50 border-slate-100",

        textMuted:
            theme === "dark"
                ? "text-slate-500"
                : "text-slate-400",

        btnBg:
            theme === "dark"
                ? "bg-black/20"
                : "bg-slate-100",
    };
}