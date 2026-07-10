export function createThemeChanger(
    theme,
    setTheme,
    updateConfig,
) {
    return () => {
        const newTheme =
            theme === "dark"
                ? "light"
                : "dark";

        setTheme(newTheme);

        updateConfig("settings", {
            Theme: newTheme,
        });
    };
}