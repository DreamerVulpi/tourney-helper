import React from "react";
import { StatusMessage } from "../../components/ui/StatusMessage.jsx";

const PLATFORM_LABELS = {
    startgg:   "START.GG",
    challonge: "CHALLONGE",
};

function getPlatformLabel(platform) {
    if (!platform || platform === "unknown") return "";
    return PLATFORM_LABELS[platform] || platform.toUpperCase();
}

export function UrlValidationMessage({ validation, theme, locale }) {
    if (validation.valid === null) return null;

    const platformLabel = getPlatformLabel(validation.platform);

    if (validation.valid === true) {
        const text = platformLabel
            ? `${platformLabel} - ${locale.UrlValid || "URL is valid"}`
            : (locale.UrlValid || "URL is valid");

        return (
            <StatusMessage
                variant="success"
                text={text}
                theme={theme}
            />
        );
    }

    if (validation.platform === "unknown") {
        return (
            <StatusMessage
                variant="warning"
                text={locale.UnsupportedPlatform || "Unsupported platform"}
                theme={theme}
            />
        );
    }

    // Валидация не прошла, но платформа распознана (startgg и т.п.)
    const text = platformLabel
        ? `${platformLabel} | ${locale.InvalidUrl || "Invalid URL"}`
        : (locale.InvalidUrl || "Invalid URL");

    return (
        <StatusMessage
            variant="warning"
            text={text}
            theme={theme}
        />
    );
}