import { X } from "lucide-react";

export function Modal({
  isOpen,
  title,

  icon: Icon,
  iconColor = "blue",

  onClose,

  children,
  footer = null,

  themeClasses,
  scrollBarClass="",
  closeOnOverlay = true,

  width = "max-w-lg",
}) {
  if (!isOpen) return null;

  const iconColors = {
    red: {
      bg: "bg-red-600/20",
      text: "text-red-500",
    },

    amber: {
      bg: "bg-amber-600/20",
      text: "text-amber-500",
    },

    green: {
      bg: "bg-green-600/20",
      text: "text-green-500",
    },

    blue: {
      bg: "bg-blue-600/20",
      text: "text-blue-500",
    },
  };

  const color = iconColors[iconColor] ?? iconColors.blue;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Window */}
      <div
        className={`
          relative
          w-full
          ${width}
          rounded-2xl
          shadow-2xl
          overflow-hidden
          border
          ${themeClasses.card}
        `}
      >
        {/* Header */}
        <div
          className={`
            flex
            items-center
            justify-between
            px-6
            py-4
            border-b
            ${themeClasses.divider}
          `}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${color.bg}`}>
                <Icon
                  size={18}
                  className={color.text}
                />
              </div>
            )}

            <h2 className="text-sm font-black uppercase italic tracking-tight">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              p-2
              rounded-lg
              transition-all
              hover:bg-red-500/10
              text-slate-500
              hover:text-red-500
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={`custom-scrollbar ${scrollBarClass}`}>
          {children}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${themeClasses.divider}`}>
            {footer}
        </div>
      </div>
    </div>
  );
}