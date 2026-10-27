import React from "react";
import {
  AUTH_STATUS,
  AUTH_STATUS_META,
  authStatusLocaleKey,
} from "../../utils/authStatus";

const SlotStatusBadgeBase = ({ slot, locale }) => {
  const status = slot?.status || AUTH_STATUS.UNKNOWN;
  const meta = AUTH_STATUS_META[status] || AUTH_STATUS_META[AUTH_STATUS.UNKNOWN];
  const statusKey = authStatusLocaleKey(status);
  const statusText = locale.Platform?.[statusKey] || status;

  const COLOR_CLASSES = {
    slate:   "text-slate-400",
    blue:    "text-blue-400",
    emerald: "text-emerald-400",
    amber:   "text-amber-400",
    orange:  "text-orange-400",
    red:     "text-red-400",
  };

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-lg border
        shrink-0
        ${meta.borderClass} ${meta.bgClass}
      `}
      title={slot?.statusReason || statusText}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
      <span
        className={`text-[9px] font-black uppercase italic whitespace-nowrap ${COLOR_CLASSES[meta.color] || "text-slate-400"}`}
      >
        {statusText}
      </span>
    </div>
  );
};

export const SlotStatusBadge = React.memo(SlotStatusBadgeBase);