import { useEffect, useState } from "react";

function calculateScale(width) {
    if (width >= 3840) return 2; // 4K
    if (width >= 2560) return 1.5; // 2K
    if (width >= 1920) return 1; // 1080p
    if (width >= 1280) return 0.85; // 720p
    return 0.75
}

export function useScale() {
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const handleResize = () => {
        const newScale = calculateScale(window.innerWidth)
        setScale(newScale);
        document.documentElement.style.fontSize = `${16 * newScale}px`; // default font size ui
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return scale;
}

