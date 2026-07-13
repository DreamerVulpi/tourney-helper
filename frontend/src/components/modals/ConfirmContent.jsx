export function ConfirmContent({
  message,
  highlightText,
  themeClasses,
}) {
  return (
    <div className="p-6 space-y-5">
      <p
        className={`
          text-xs
          leading-relaxed
          ${themeClasses.textMuted}
        `}
      >
        {message}
      </p>

      <div
        className={`
          rounded-xl
          border
          p-4
          text-center
          ${themeClasses.section}
        `}
      >
        <span className="text-sm font-black tracking-wide">
          {highlightText}
        </span>
      </div>
    </div>
  );
}