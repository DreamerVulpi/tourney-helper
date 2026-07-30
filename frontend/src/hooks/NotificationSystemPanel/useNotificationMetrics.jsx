import { useState, useEffect } from 'react';
import { GetNotificationMetrics } from "../../../wailsjs/go/application/App.js"

export function useNotificationMetrics(enabled) {
    const [snapshot, setSnapshot] = useState(null);

    useEffect(() => {
        if (!enabled) return;

        const update = async () => {
            setSnapshot(await GetNotificationMetrics());
        };

        update();

        const timer = setInterval(update, 1000);

        return () => clearInterval(timer);
    }, [enabled]);

    return snapshot;
}