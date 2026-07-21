export function MessageBox({
    icon: Icon,
    iconColor,
    borderClass,
    textClass = "text-[11px] font-semibold leading-relaxed",
    children,
    footer,
}) {
    return (
        <div className={`inline-flex flex-col items-center text-center p-5 rounded-xl border ${borderClass}`}>
            <Icon 
                className={`${iconColor} mb-3 animate-pulse`} 
                size={36} 
            />

            <div className={textClass}>
                {children}
            </div>

            {footer && footer}
        </div>
    );
}