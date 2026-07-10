export function ExtraButton({
    icon: Icon,
    label,
    iconClass,
    onClick,
}) {
    return (
        <button
            onClick={onClick}
            className="hover:text-blue-500 transition-colors flex items-center gap-[0.25rem] group"
        >
            <Icon
                style={{
                    width: "0.875rem",
                    height: "0.875rem",
                }}
                className={`${iconClass} transition-transform`}
            />
            <span className="translate-y-[0.05rem]">
                {label}
            </span>
        </button>
    );
}