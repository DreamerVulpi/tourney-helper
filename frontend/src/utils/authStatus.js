export const AUTH_STATUS = {
  UNKNOWN:      "unknown",
  PENDING:      "pending",
  AUTHORIZED:   "authorized",
  UNAUTHORIZED: "unauthorized",
  EXPIRED:      "expired",
  REVOKED:      "revoked",
  ERROR:        "error",
  INVALID:      "invalid",
  INPROGRESS:   "inprogress",
};

export const AUTH_STATUS_META = {
  [AUTH_STATUS.UNKNOWN]: {
    color: "slate",
    dotClass: "bg-slate-500",
    borderClass: "border-slate-700",
    bgClass: "bg-slate-800/40",
    hoverClass: "hover:border-slate-500",
  },
  [AUTH_STATUS.PENDING]: {
    color: "blue",
    dotClass: "bg-blue-500 animate-pulse",
    borderClass: "border-blue-500/60",
    bgClass: "bg-blue-500/5",
    hoverClass: "hover:border-blue-500",
  },
  [AUTH_STATUS.INPROGRESS]: {
    color: "indigo",
    dotClass: "bg-indigo-500 animate-pulse",
    borderClass: "border-indigo-500/60",
    bgClass: "bg-indigo-500/5",
    hoverClass: "hover:border-indigo-500",
  },
  [AUTH_STATUS.AUTHORIZED]: {
    color: "emerald",
    dotClass: "bg-emerald-500",
    borderClass: "border-emerald-500/60",
    bgClass: "bg-emerald-500/5",
    hoverClass: "hover:border-emerald-500",
  },
  [AUTH_STATUS.UNAUTHORIZED]: {
    color: "amber",
    dotClass: "bg-amber-500",
    borderClass: "border-amber-500/40",
    bgClass: "bg-amber-500/5",
    hoverClass: "hover:border-amber-500/70",
  },
  [AUTH_STATUS.EXPIRED]: {
    color: "orange",
    dotClass: "bg-orange-500",
    borderClass: "border-orange-500/60",
    bgClass: "bg-orange-500/5",
    hoverClass: "hover:border-orange-500",
  },
  [AUTH_STATUS.REVOKED]: {
    color: "red",
    dotClass: "bg-red-500",
    borderClass: "border-red-500/60",
    bgClass: "bg-red-500/5",
    hoverClass: "hover:border-red-500",
  },
  [AUTH_STATUS.ERROR]: {
    color: "red",
    dotClass: "bg-red-500 animate-pulse",
    borderClass: "border-red-500/60",
    bgClass: "bg-red-500/5",
    hoverClass: "hover:border-red-500",
  },
  [AUTH_STATUS.INVALID]: {
    color: "red",
    dotClass: "bg-red-500",
    borderClass: "border-red-500/60",
    bgClass: "bg-red-500/5",
    hoverClass: "hover:border-red-500",
  },
};

export const isAuthorized = (status) => status === AUTH_STATUS.AUTHORIZED;
export const needsReauth  = (status) =>
  status === AUTH_STATUS.EXPIRED ||
  status === AUTH_STATUS.REVOKED ||
  status === AUTH_STATUS.INVALID;

export const authStatusLocaleKey = (status) => {
  switch (status) {
    case AUTH_STATUS.AUTHORIZED:   return "Authorized";
    case AUTH_STATUS.UNAUTHORIZED: return "Unauthorized";
    case AUTH_STATUS.EXPIRED:      return "Expired";
    case AUTH_STATUS.ERROR:        return "Error";
    case AUTH_STATUS.INVALID:      return "Invalid";
    case AUTH_STATUS.PENDING:      return "Pending";
    case AUTH_STATUS.INPROGRESS:   return "InProgress";
    default:                       return "Unknown";
  }
};