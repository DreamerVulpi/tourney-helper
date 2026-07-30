import { useState, useEffect } from 'react';
import { GetGetDataMetrics } from "../../../wailsjs/go/application/App.js"

export function useGetDataMetrics(enabled) {
    const [snapshot, setSnapshot] = useState(null);

    useEffect(() => {
        if (!enabled) return;

        const update = async () => {
            setSnapshot(await GetGetDataMetrics());
        };

        update();

        const timer = setInterval(update, 1000);

        return () => clearInterval(timer);
    }, [enabled]);

    return snapshot;
}