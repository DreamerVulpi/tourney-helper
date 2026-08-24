import { X } from "lucide-react";
import { ModalContainer } from "./ModalContainter";

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

  layer = "100",
  width = "max-w-lg",
  showCloseButton = true,
  headerRight = null,
  position = "screen",
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
  <ModalContainer 
    isOpen={isOpen}
    onClose={onClose}
    width={width}
    layer={layer}
    position={position}
    >
    {/* Window */}
      <div
        className={`
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
          <div className="flex item-center gap-4">
            {headerRight}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="
                  p-2
                  rounded-lg
                  
                  hover:bg-red-500/10
                  text-slate-500
                  hover:text-red-500
                "
              >
                <X size={20} />
              </button>
            )}
          </div>
            
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

  </ModalContainer>

  ); 
}