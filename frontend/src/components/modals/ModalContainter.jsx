export function ModalContainer({
  isOpen,
  onClose,
  closeOnOverlay = true,
  width = "max-w-lg",
  children,
  layer = 100,
  position = "screen",
}) {
  if (!isOpen) return null;

  const positionClass = {
    screen: "fixed inset-0",
    content: "absolute inset-x-0 bottom-0 top-0",
  }[position];

  return (
    <div
      className={`${positionClass} flex items-center justify-center p-4`}
      style={{ zIndex: layer }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      <div className={`relative w-full ${width}`}>
        {children}
      </div>
    </div>
  );
}