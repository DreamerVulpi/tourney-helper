import {
  Settings2,
} from "lucide-react";

export function PlatformBtn({
  label,
  active,
  auth,
  disabled,
  onClick,
  onSettingsClick,
  themeClasses,
  locale,
}) {
  return (
    <div className="relative group/btn">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full h-[2.8rem] flex flex-col items-center justify-center py-[0.25rem] rounded-xl border transition-all relative overflow-hidden ${
          disabled
            ? "opacity-30 cursor-not-allowed"
            : active
              ? "bg-blue-600/10 border-blue-600 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
              : `${themeClasses.btnSecondary}`
        }`}
      >
        <div className="flex flex-col items-center gap-0.5 z-10">
          <span className="text-[10px] font-black uppercase italic tracking-wider leading-none">
            {label}
          </span>
          {auth !== undefined && (
            <span
              className={`text-[7px] font-black uppercase italic ${auth ? "text-green-500" : "text-red-500"}`}
            >
              {auth ? locale.Authorized : locale.Unauthorized}
            </span>
          )}
        </div>
      </button>

      {/* Кнопка настроек параметров */}
      {!disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick();
          }}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all z-20 
            ${active ? "text-blue-600 hover:bg-blue-600/20" : "text-slate-500 hover:bg-slate-500/10"}`}
        >
          <Settings2 size={14} />
        </button>
      )}
    </div>
  );
}