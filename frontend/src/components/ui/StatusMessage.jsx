import React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

const VARIANTS = {
    success: {
        icon: CheckCircle2,
        text: "text-green-500",
        dark: {
            bg: "bg-green-500/10",
            border: "border-green-500/20",
        },
        light: {
            bg: "bg-white",
            border: "border-green-200 shadow-lg",
        },
    },
    warning: {
        icon: AlertCircle,
        text: "text-amber-500",
        dark: {
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
        light: {
            bg: "bg-white",
            border: "border-amber-200 shadow-lg",
        },
    },
    error: {
        icon: XCircle,
        text: "text-red-500",
        dark: {
            bg: "bg-red-500/10",
            border: "border-red-500/20",
        },
        light: {
            bg: "bg-white",
            border: "border-red-200 shadow-lg",
        },
    },
    info: {
        icon: Info,
        text: "text-blue-500",
        dark: {
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        light: {
            bg: "bg-white",
            border: "border-blue-200 shadow-lg",
        },
    },
};

function StatusMessageBase({
    variant = "warning",   // "success" | "warning" | "error" | "info"
    text,
    icon: CustomIcon,      // опционально: своя иконка
    className = "",
    theme = "dark",        // "dark" | "light"
    animate = true,        // slide-in анимация
}) {
    const cfg = VARIANTS[variant] ?? VARIANTS.warning;
    const Icon = CustomIcon ?? cfg.icon;

    const palette = theme === "dark" ? cfg.dark : cfg.light;

    return (
        <div
            className={`
                flex
                items-center
                gap-2
                px-4
                py-2
                border
                rounded-xl
                ${cfg.text}
                ${palette.bg}
                ${palette.border}
                ${animate ? "slide-in-from-bottom-2" : ""}
                ${className}
            `}
        >
            <Icon size={14} className="shrink-0" />

            <span className="font-bold uppercase italic tracking-tight leading-tight">
                {text}
            </span>
        </div>
    );
}

export const StatusMessage = React.memo(StatusMessageBase);