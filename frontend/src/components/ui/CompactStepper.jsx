import React from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

export function CompactStepper({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue = (v) => v,
  resetValue,
  resetLabel = "Reset",
  themeClasses,
}) {
  const clamp = (next) => Math.max(min, Math.min(max, next));

  return (
    <div
      className={`flex w-fit items-center gap-0.5 rounded-lg border pl-1 pr-0.5 py-0.5 ${
        themeClasses?.field || "bg-slate-900 border-slate-700"
      }`}
    >
      <button
        type="button"
        onClick={() => onChange?.(clamp(value - step))}
        disabled={value <= min}
        className="p-0.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus size={12} />
      </button>

      <span className="w-9 text-center text-xs font-black italic tabular-nums">
        {formatValue(value)}
      </span>

      <button
        type="button"
        onClick={() => onChange?.(clamp(value + step))}
        disabled={value >= max}
        className="p-0.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={12} />
      </button>

      <button
        type="button"
        onClick={() => onChange?.(resetValue)}
        disabled={resetValue === undefined || value === resetValue}
        title={resetLabel}
        className="p-0.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <RotateCcw size={12} />
      </button>
    </div>
  );
}

export default CompactStepper;
