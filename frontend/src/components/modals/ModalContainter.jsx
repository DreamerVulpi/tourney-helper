export function ModalContainer({
    isOpen,
    onClose,
    closeOnOverlay = true,
    width = "max-w-lg",
    children,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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