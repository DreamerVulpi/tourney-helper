import React from "react";

export const ButtonFooter = React.memo(function ButtonFooter({
  children,
  absolute = true,
  positionClassName = "bottom-8 right-8",
  zIndex = "z-40",
  className = "",
}) {
  return (
    <div
      className={`
        ${absolute ? "absolute" : ""}
        ${positionClassName}
        ${zIndex}
        ${className}
      `}
    >
      <div className="flex flex-col items-end gap-3">
        {children}
      </div>
    </div>
  );
});