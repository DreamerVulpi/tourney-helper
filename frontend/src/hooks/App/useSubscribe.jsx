import { useEffect } from "react";
import { EventsOn } from "../../../wailsjs/runtime/runtime";

export function useLogsSubscribe(loadLogs) {
    useEffect(() => {
        const unsubcribe = EventsOn("logs-updated", loadLogs);
    
        return unsubcribe;
    }, [loadLogs]);
}