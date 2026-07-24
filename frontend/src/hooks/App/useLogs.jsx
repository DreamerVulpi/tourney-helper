import { useState } from "react";
import { GetLogs } from "../../../wailsjs/go/application/App.js"

function log(log) {
    return {
        time: log.time || "", 
        msg: log.msg || "",
        type: (log.type || "info").toLowerCase(),
    };
}


export function createLoadLogs(setLogs) {
    return async function loadLogs() {
        try {
            const logs = await GetLogs();
            setLogs(logs.map(log).reverse());
        } catch (err) {
            console.error("Failed to load logs:", err)
        }
    };
}
