export function ModalContainer({
  isOpen,
  onClose,
  closeOnOverlay = true,
  width = "max-w-lg",
  children,
  layer = 100,
  position = "screen",
  overlay = true,
  blur = true,
  anchorRect = null,
  offset = 8,
  placement = "top",
}) {
  if (!isOpen) return null;

  const basePositionClass = {
    screen: "fixed inset-0",
    content: "absolute inset-x-0 bottom-0 top-0",
    anchored: "fixed inset-0 pointer-events-none",
  }[position];

  const anchorStyle = (() => {
    if (position !== "anchored" || !anchorRect) return undefined;

    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const isLeftHalf = anchorCenterX < window.innerWidth / 2;

    const top =
      placement === "top"
        ? anchorRect.top - offset
        : anchorRect.top + anchorRect.height + offset;

    return {
      position: "fixed",
      top,
      left: isLeftHalf ? anchorRect.left : anchorRect.left + anchorRect.width,
      transform: `${
        isLeftHalf ? "translate(0" : "translate(-100%"
      }, ${placement === "top" ? "-100%" : "0"})`,
      pointerEvents: "auto",
      zIndex: Number(layer) + 1,
    };
  })();

  return (
    <div
      className={`${basePositionClass} ${
        position === "anchored" ? "" : "flex items-center justify-center p-4"
      }`}
      style={{ zIndex: layer }}
    >
      {position !== "anchored" && overlay && (
        <div
          className={`absolute inset-0 bg-black/60 ${blur ? "backdrop-blur-sm" : ""}`}
          onClick={closeOnOverlay ? onClose : undefined}
        />
      )}
      {position === "anchored" && closeOnOverlay && (
        <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      )}

      {/* Окно */}
      <div
        className={`${
          position === "anchored"
            ? `${width} max-w-[calc(100vw-1rem)]`
            : `relative w-full ${width}`
        }`}
        style={anchorStyle}
      >
        {children}
      </div>
    </div>
  );
}