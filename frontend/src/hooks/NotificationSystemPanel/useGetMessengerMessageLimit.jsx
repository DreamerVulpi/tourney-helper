import { useEffect, useState } from "react";
import { GetMessengerMessageLimit } from "../../../wailsjs/go/application/App.js";

export function useMessengerMessageLimit() {
    const [limit, setLimit] = useState(0);

    useEffect(() => {
        let mounted = true;

        GetMessengerMessageLimit()
            .then((value) => {
                if (mounted) {
                    setLimit(value);
                }
            })
            .catch(console.error);

        return () => {
            mounted = false;
        };
    }, []);

    return limit;
}