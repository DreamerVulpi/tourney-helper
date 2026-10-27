import React from "react";

function EmptyStateBase({
  icon: Icon,
  title,
  description,
  iconSize = 32,
  strokeWidth = 1.5,
  action,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-6 ${className}`}>
      {Icon && (
        <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-2xl text-slate-500 mb-4 shadow-inner">
          <Icon
            size={iconSize}
            strokeWidth={strokeWidth}
          />
        </div>
      )}

      {title && (
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1 italic text-center">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-[10px] text-slate-500 max-w-[280px] leading-relaxed uppercase font-bold text-center">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

export const EmptyState = React.memo(EmptyStateBase);