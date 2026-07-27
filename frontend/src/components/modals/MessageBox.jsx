export function MessageBox({
    icon: Icon,
    iconColor,
    iconSize = 24,
    borderClass,
    textClass = "text-[11px] font-semibold leading-relaxed",
    children,
    footer,
    layout = "center", // center | left
}) {
    if (layout === "left") {
        return (
            <div className={`flex flex-col p-5 rounded-xl border ${borderClass}`}>
                <div className="flex items-center gap-3">
                    <Icon
                        className={`${iconColor} flex-shrink-0 mt-0.5`}
                        size={iconSize}
                    />

                    <div className={textClass}>
                        {children}
                    </div>
                </div>

                {footer && <div className="mt-4">{footer}</div>}
            </div>
        );
    }

    return (
        <div className={`inline-flex flex-col items-center text-center p-5 rounded-xl border ${borderClass}`}>
            <Icon
                className={`${iconColor} mb-3`}
                size={36}
            />

            <div className={textClass}>
                {children}
            </div>

            {footer && footer}
        </div>
    );
}