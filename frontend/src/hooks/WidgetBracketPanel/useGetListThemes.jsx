import { useEffect, useState } from 'react';
import { GetListThemes } from '../../../wailsjs/go/application/App.js';

const DEFAULT_THEME = {
    value: 'default',
    label: 'Default',
};

export function useGetListThemes() {
    const [themes, setThemes] = useState([DEFAULT_THEME]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const list = await GetListThemes();

                // Если backend вернул пустой список — оставляем только Default
                if (!list || list.length === 0) {
                    if (!cancelled) setThemes([DEFAULT_THEME]);
                    return;
                }

                // Гарантируем, что "default" всегда есть в списке
                const hasDefault = list.includes('default');
                const options = list.map(name => ({
                    value: name,
                    label: formatThemeLabel(name),
                }));

                if (!hasDefault) {
                    options.unshift(DEFAULT_THEME);
                } else {
                    // Перемещаем default в начало
                    options.sort((a, b) => {
                        if (a.value === 'default') return -1;
                        if (b.value === 'default') return 1;
                        return a.value.localeCompare(b.value);
                    });
                }

                if (!cancelled) setThemes(options);
            } catch (err) {
                console.error('Failed to load themes:', err);
                if (!cancelled) setThemes([DEFAULT_THEME]);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return themes;
}

function formatThemeLabel(name) {
    // "startgg" -> "Startgg"
    // "startgg-dark" -> "Startgg Dark"
    return name
        .split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}