import { useCallback, useState } from "react";
import { CheckUpdate } from "../../../wailsjs/go/application/App";

export function useCheckUpdate() {
    const [checking, setChecking] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [error, setError] = useState(null);

    const check = useCallback(async () => {
        try {
            setChecking(true);
            setError(null);

            const result = await CheckUpdate();

            setUpdateInfo(result);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setChecking(false);
        }
    }, []);

    return {
        checking,
        updateInfo,
        error,
        check,
    };
}